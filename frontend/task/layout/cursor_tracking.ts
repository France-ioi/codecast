import {useEffect, useRef} from 'react';
import {throttle} from 'lodash';
import {useDispatch} from 'react-redux';
import {CursorPosition, ActionTypes as LayoutActionTypes, CursorPoint, CursorPointRelative} from './actionTypes';
import {useAppSelector} from '../../hooks';
import {getRecorderState} from '../../recorder/selectors';
import {RecorderStatus} from '../../recorder/store';
import log from 'loglevel';
import {getPlayerState} from '../../player/selectors';
import scrollIntoView from "scroll-into-view-if-needed";

export type ScreenPointToRecordingTransformer = (point: CursorPoint) => Partial<CursorPosition>;
export type RecordingToScreenPointTransformer = (data: Partial<CursorPosition>, mainZone?: HTMLElement) => CursorPoint|null;

const zonePointToScreenTransformers: {[zoneName: string]: RecordingToScreenPointTransformer} = {};

const THROTTLE_TIME_BETWEEN_POSITIONS = 100; // ms
const DISTANCE_MIN_BETWEEN_POSITIONS = 10; // px

export function useCursorPositionTracking(specialZoneName?: string, pointToRecording?: ScreenPointToRecordingTransformer, recordingToPoint?: RecordingToScreenPointTransformer) {
    const isRecording = useAppSelector(state => RecorderStatus.Recording === getRecorderState(state).status);
    const isPlaying = useAppSelector(state => getPlayerState(state).isReady);
    const previousPoint = useRef<CursorPoint>(null);

    const dispatch = useDispatch();

    if (specialZoneName) {
        zonePointToScreenTransformers[specialZoneName] = recordingToPoint;
    }

    useEffect(() => {
        if (!isRecording) {
            return null;
        }
        if (isPlaying) {
            return null;
        }

        const updateMousePosition = (ev) => {
            const point = {x: ev.clientX, y: ev.clientY};
            if (previousPoint.current) {
                const distance = Math.sqrt(Math.pow(point.x - previousPoint.current.x, 2) + Math.pow(point.y - previousPoint.current.y, 2));
                if (distance < DISTANCE_MIN_BETWEEN_POSITIONS) {
                    return;
                }
            }

            previousPoint.current = point;
            let element = document.elementFromPoint(point.x, point.y) as HTMLElement;
            if (element.closest<HTMLElement>('.cursor-recording-disabled')) {
                return;
            }

            const mainZone = element.closest<HTMLElement>('*:not(clipPath)[id],.cursor-main-zone');

            if (mainZone) {
                const mainZoneName = mainZone.getAttribute('data-cursor-zone') ?? '#' + mainZone.getAttribute('id');
                if (pointToRecording && mainZoneName !== specialZoneName) {
                    return;
                }
                if (!pointToRecording && mainZone.hasAttribute('data-cursor-self-handling')) {
                    return;
                }

                const positionRelativeToMainZone = extractRelativePosition(point, mainZone);

                const additional = pointToRecording ? pointToRecording(point) : null;
                if (additional?.element) {
                    element = additional.element;
                    delete additional.element;
                }

                const cursorPosition: CursorPosition = {
                    zone: mainZoneName,
                    posToZone: positionRelativeToMainZone,
                    domToElement: extractDomTreeToElement(element, mainZone).join(','),
                    posToElement: extractRelativePosition(point, element),
                    ...additional,
                };

                log.getLogger('recorder').debug('[Mouse] ' + JSON.stringify(cursorPosition));

                dispatch({type: LayoutActionTypes.LayoutCursorPositionChanged, payload: {position: cursorPosition}});
            }
        };

        const throttledUpdateMousePosition = throttle(updateMousePosition, THROTTLE_TIME_BETWEEN_POSITIONS);

        window.addEventListener('mousemove', throttledUpdateMousePosition);

        return () => {
            window.removeEventListener('mousemove', throttledUpdateMousePosition);

            if (specialZoneName) {
                delete zonePointToScreenTransformers[specialZoneName];
            }
        };
    }, [isRecording, isPlaying]);
}

// For recording
function extractDomTreeToElement(child: HTMLElement, ancestor: HTMLElement) {
    if (child === ancestor) {
        return [];
    }

    const parentElement = child.parentElement;

    return [
        ...extractDomTreeToElement(parentElement, ancestor),
        `${child.tagName.toLocaleLowerCase()}${child.getAttribute('id') ? '#' + child.getAttribute('id') : ''}(${Array.from(parentElement.children).indexOf(child)})`,
    ];
}

function extractRelativePosition(point: CursorPoint, element: HTMLElement): CursorPointRelative {
    const boundingBox = element.getBoundingClientRect();

    return {
        x: Math.round(point.x - boundingBox.left),
        y: Math.round(point.y - boundingBox.top),
        h: boundingBox.height,
        w: boundingBox.width,
    };
}

// For replay
export function cursorPositionToScreenCoordinates(position: CursorPosition): CursorPoint|null {
    const zoneName = position.zone;
    const point = position.posToZone;
    let mainZone = null;
    if ('#' === zoneName.substring(0, 1)) {
        mainZone = document.querySelector<HTMLElement>(`[id="${zoneName.substring(1)}"]`);
    } else {
        mainZone = document.querySelector<HTMLElement>(`[data-cursor-zone="${zoneName}"]`);
    }
    if (!mainZone) {
        return null;
    }

    if (zonePointToScreenTransformers[zoneName]) {
        const result = zonePointToScreenTransformers[zoneName](position, mainZone);
        if (result) {
            log.getLogger('replay').debug('[Mouse] Specific handler for zoneName ' + zoneName, result);

            return result;
        }
    }

    if (position.domToElement) {
        const domParts = position.domToElement.split(',');
        const domElement = getDomElementFromDomTree(mainZone, domParts);
        if (domElement) {
            log.getLogger('replay').debug('[Mouse] DOM tree strategy for zoneName ' + zoneName, domElement, position.posToElement);
            scrollIntoView(domElement, {
                block: 'center',
                behavior: 'smooth'
            });

            return applyRelativePosition(position.posToElement, domElement);
        }
    }

    log.getLogger('replay').debug('[Mouse] Main zoneName strategy for zoneName ' + zoneName);

    return applyRelativePosition(point, mainZone);
}

export function getDomElementFromDomTree(ancestor: HTMLElement, domParts: string[]): HTMLElement|null {
    if (0 === domParts.length) {
        return ancestor;
    }

    const nextDomPart = domParts[0];
    const partsRegExp = new RegExp("^([a-z]+)(#([a-zA-Z\-\_]+))?\\(([0-9]+)\\)$");
    const matched = nextDomPart.match(partsRegExp);
    if (!matched) {
        return null;
    }

    const tagName = matched[1];
    const elementId = matched[3];
    const childNumber = Number(matched[4]);
    const childs = [...ancestor.children] as HTMLElement[];
    const child = childs[childNumber];
    if (!child || tagName !== child.tagName.toLocaleLowerCase() || (elementId && elementId !== child.getAttribute('id'))) {
        return null;
    }

    return getDomElementFromDomTree(child, domParts.slice(1));
}

function applyRelativePosition(point: CursorPointRelative, element: HTMLElement) {
    const boundingBox = element.getBoundingClientRect();

    // Relative
    return {
        x: Math.round(boundingBox.left + (point.x * boundingBox.width / point.w)),
        y: Math.round(boundingBox.top + (point.y * boundingBox.height / point.h)),
    };

    // Absolute
    // return {
    //     x: Math.round(boundingBox.left + point.x),
    //     y: Math.round(boundingBox.top + point.y),
    // };
}
