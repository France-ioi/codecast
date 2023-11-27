import {useEffect} from 'react';
import {throttle} from 'lodash';
import {useDispatch} from 'react-redux';
import {CursorPosition, ActionTypes as LayoutActionTypes, CursorPoint} from './actionTypes';
import {useAppSelector} from '../../hooks';
import {getRecorderState} from '../../recorder/selectors';
import {RecorderStatus} from '../../recorder/store';
import log from 'loglevel';

export function useCursorPositionTracking(specialZoneName?: string, specialHandler?: (absPoint: CursorPoint) => object) {
    const isRecording = useAppSelector(state => RecorderStatus.Recording === getRecorderState(state).status);

    const dispatch = useDispatch();

    useEffect(() => {
        if (!isRecording) {
            return null;
        }

        const updateMousePosition = ev => {
            const point = {x: ev.clientX, y: ev.clientY};
            const element = document.elementFromPoint(point.x, point.y) as HTMLElement;

            const mainZone = element.closest<HTMLElement>(".cursor-main-zone");

            if (mainZone) {
                const mainZoneName = mainZone.getAttribute('data-cursor-zone');
                if (specialHandler && mainZoneName !== specialZoneName) {
                    return;
                }
                if (!specialHandler && mainZone.hasAttribute('data-cursor-self-handling')) {
                    return;
                }

                const positionRelativeToMainZone = extractRelativePosition(point, mainZone);

                const additional = specialHandler ? specialHandler(point) : null;

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

        const throttledUpdateMousePosition = throttle(updateMousePosition, 100);

        window.addEventListener('mousemove', throttledUpdateMousePosition);

        return () => {
            window.removeEventListener('mousemove', throttledUpdateMousePosition);
        };
    }, [isRecording]);
}



export function cursorPositionToScreenCoordinates(position: CursorPosition): CursorPoint|null {
    const zone = position.zone;
    const point = position.posToZone;
    const mainZone = document.querySelector<HTMLElement>(`[data-cursor-zone="${zone}"]`);
    if (!mainZone) {
        return null;
    }

    console.log('start calculating', performance.now());

    if (position.domToElement) {
        const domParts = position.domToElement.split(',');
        const domElement = getDomElementFromDomTree(mainZone, domParts);
        if (domElement) {
            console.log('dom element strategy', domElement, position.posToElement);

            return applyRelativePosition(position.posToElement, domElement);
        }
    }

    console.log('main zone strategy');

    return applyRelativePosition(point, mainZone);
}

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

function getDomElementFromDomTree(ancestor: HTMLElement, domParts: string[]): HTMLElement|null {
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
    console.log({ancestor, domParts, nextDomPart, tagName, elementId, childNumber, child});
    if (!child || tagName !== child.tagName.toLocaleLowerCase() || (elementId && elementId !== child.getAttribute('id'))) {
        console.log('return null', tagName, child.tagName, elementId)
        return null;
    }

    console.log('valid child');

    return getDomElementFromDomTree(child, domParts.slice(1));
}

function extractRelativePosition(point: CursorPoint, element: HTMLElement): CursorPoint {
    const boundingBox = element.getBoundingClientRect();

    return {
        x: Math.round(point.x - boundingBox.left),
        y: Math.round(point.y - boundingBox.top),
    };
}

function applyRelativePosition(point: CursorPoint, element: HTMLElement) {
    const boundingBox = element.getBoundingClientRect();

    return {
        x: Math.round(boundingBox.left + point.x),
        y: Math.round(boundingBox.top + point.y),
    };
}
