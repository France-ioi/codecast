import {buffers, eventChannel} from 'redux-saga';
import {put, take} from 'redux-saga/effects';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import produce from "immer";
import {AppStore} from "../store";

export const mainViewGeometries = [
    {size: 'lg', width: 1140, svgScale: 1.0},
    {size: 'md', width: 940, svgScale: 0.9},
    {size: 'sm', width: 794, svgScale: 0.75},
];

// TODO: Put in a store's attribute "window" instead of in the root of the store.
export const initialStateWindow = {
    mainViewGeometry: mainViewGeometries[0],
    panes: [],
    windowWidth: 0,
    windowHeight: 0,
    containerWidth: 0,
    viewportTooSmall: false
}

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        draft.mainViewGeometry = initialStateWindow.mainViewGeometry;
        draft.panes = initialStateWindow.panes;
        draft.windowWidth = initialStateWindow.windowWidth;
        draft.windowHeight = initialStateWindow.windowHeight;
    }));

    // Make windowResized update the global state 'size'.
    bundle.defineAction(ActionTypes.WindowResized);
    bundle.addReducer(ActionTypes.WindowResized, produce((draft: AppStore, action) => {
        const {width, height} = action;

        draft.windowWidth = width;
        draft.windowHeight = height;
    }));

    // Event channel for resize events.
    // Only the most recent event is kept in the buffer.
    const resizeMonitorChannel = eventChannel(function(listener) {
        function onResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            listener({width, height});
        }

        window.addEventListener('resize', onResize);

        // Add an initial event to the channel.
        onResize();

        return function() {
            window.removeEventListener('resize', onResize);
        };
    }, buffers.sliding(1));

    // Lift resize events into windowResized actions.
    bundle.addSaga(function* monitorResize() {
        while (true) {
            let {width, height} = yield take(resizeMonitorChannel);

            yield put({type: ActionTypes.WindowResized, width, height});
        }
    });

    bundle.addLateReducer(produce(function updateGeometry(draft) {
        if (!draft) {
            return draft;
        }

        /* Default to the largest geometry, no visible panes. */
        let geometry = mainViewGeometries[0];
        let panes = draft.panes;
        let viewportTooSmall = false;

        const windowWidth = draft.windowWidth;
        if (windowWidth) {
            let mainViewWidth = windowWidth;

            /* Account for width of enabled panes. */
            panes = panes.map(pane => {
                if (!pane.enabled) {
                    pane.visible = false
                } else {
                    mainViewWidth -= (pane.width + 10);

                    pane.visible = true;
                }

                return pane;
            });

            /* Find the largest main-view geometry that fits the available space. */
            let geometryIndex = 0;
            while (geometry.width > mainViewWidth) {
                geometryIndex += 1;

                if (geometryIndex === mainViewGeometries.length) {
                    /* Screen is too small, use the smallest geometry and hide all panes. */
                    viewportTooSmall = true;
                    panes = panes.map(pane => {
                        pane.visible = false;

                        return pane;
                    });

                    break;
                }

                geometry = mainViewGeometries[geometryIndex];
            }
        }

        /* Compute the container width */
        /* XXX is this still needed? */
        let containerWidth = geometry.width;
        panes = panes.map(pane => {
            if (pane.visible) {
                containerWidth += pane.width;
            }

            return pane;
        });

        draft.viewportTooSmall = viewportTooSmall;
        draft.containerWidth = containerWidth;
        draft.mainViewGeometry = geometry;
        draft.panes = panes;
    }));
};
