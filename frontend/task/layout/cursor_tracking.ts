import {useEffect} from 'react';
import {throttle} from 'lodash';
import {useDispatch} from 'react-redux';
import {CursorPosition, ActionTypes as LayoutActionTypes, CursorPoint} from './actionTypes';
import {useAppSelector} from '../../hooks';
import {getRecorderState} from '../../recorder/selectors';
import {RecorderStatus} from '../../recorder/store';

export function useCursorPositionTracking(specialZoneName?: string, specialHandler?: (point: CursorPoint) => object) {
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

                const additional = specialHandler ? specialHandler(positionRelativeToMainZone) : null;

                const cursorPosition: CursorPosition = {
                    zone: mainZoneName,
                    position: positionRelativeToMainZone,
                    domTree: extractDomTreeToElement(element, mainZone).join(','),
                    positionToElement: extractRelativePosition(point, element),
                    ...additional,
                };

                console.log(JSON.stringify(cursorPosition));

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
    const point = position.position;
    const mainZone = document.querySelector<HTMLElement>(`[data-cursor-zone="${zone}"]`);
    if (!mainZone) {
        return null;
    }

    const mainZoneDimensions = {
        height: mainZone.clientHeight,
        width: mainZone.clientWidth,
        top: mainZone.offsetTop,
        left: mainZone.offsetLeft,
    };

    const absoluteCoordinates = {
        x: point.x + mainZoneDimensions.left,
        y: point.y + mainZoneDimensions.top,
    };

    return {
        x: absoluteCoordinates.x,
        y: absoluteCoordinates.y,
    };
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

function extractRelativePosition(point: CursorPoint, element: HTMLElement): CursorPoint {
    return {
        x: point.x - element.offsetLeft,
        y: point.y - element.offsetTop,
    };
}
