import {buffers, eventChannel} from 'redux-saga';
import {put, take} from 'typed-redux-saga';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {computeLayoutType} from "../task/layout/layout";
import {App} from "../index";

export const mainViewGeometries = [
    {size: 'lg', width: 1140, svgScale: 1.0},
    {size: 'md', width: 940, svgScale: 0.9},
    {size: 'sm', width: 794, svgScale: 0.75},
];

// TODO: It would be better to put this in a store's attribute "window" instead of in the root of the store.
export const initialStateWindow = {
    mainViewGeometry: mainViewGeometries[0],
    panes: {},
    windowWidth: 0,
    windowHeight: 0,
    containerWidth: 0,
    viewportTooSmall: false
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.mainViewGeometry = initialStateWindow.mainViewGeometry;
        state.panes = {...initialStateWindow.panes};
        state.windowWidth = initialStateWindow.windowWidth;
        state.windowHeight = initialStateWindow.windowHeight;
    });

    // Make windowResized update the global state 'size'.
    bundle.defineAction(ActionTypes.WindowResized);
    bundle.addReducer(ActionTypes.WindowResized, (state: AppStore, action) => {
        const {width, height} = action;

        // We recompute layout type only when width changes, because on mobile the virtual keyboard opening
        // triggers a window resized event and this should not change the layout to have the best UX
        if (state.windowWidth !== width) {
            state.layout.type = computeLayoutType(width, height);
        }

        state.windowWidth = width;
        state.windowHeight = height;
    });

    // Event channel for resize events.
    // Only the most recent event is kept in the buffer.
    const resizeMonitorChannel = eventChannel<{width: number, height: number}>(function(listener) {
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
    bundle.addSaga(function* monitorResize(app: App) {
        if ('main' !== app.environment) {
            return;
        }

        while (true) {
            let {width, height} = yield* take(resizeMonitorChannel);

            yield* put({type: ActionTypes.WindowResized, width, height});
        }
    });

    bundle.addLateReducer(function updateGeometry(state: AppStore) {
        if (!state.panes) {
            return;
        }

        /* Default to the largest geometry, no visible panes. */
        let geometry = mainViewGeometries[0];
        let panes = state.panes;
        let viewportTooSmall = false;

        const windowWidth = state.windowWidth;
        if (windowWidth) {
            let mainViewWidth = windowWidth;

            /* Account for width of enabled panes. */
            Object.keys(panes).map((key) => {
                const pane = panes[key];

                if (!pane.enabled) {
                    pane.visible = false
                } else {
                    mainViewWidth -= (pane.width + 10);

                    pane.visible = true;
                }
            });

            /* Find the largest main-view geometry that fits the available space. */
            let geometryIndex = 0;
            while (geometry.width > mainViewWidth) {
                geometryIndex += 1;

                if (geometryIndex === mainViewGeometries.length) {
                    /* Screen is too small, use the smallest geometry and hide all panes. */
                    viewportTooSmall = true;
                    Object.keys(panes).map((key: string) => {
                        const pane = panes[key];

                        pane.visible = false;
                    });

                    break;
                }

                geometry = mainViewGeometries[geometryIndex];
            }
        }

        /* Compute the container width */
        /* XXX is this still needed? */
        let containerWidth = geometry.width;
        Object.keys(panes).map((key: string) => {
            const pane = panes[key];

            if (pane.visible) {
                containerWidth += pane.width;
            }
        });

        state.viewportTooSmall = viewportTooSmall;
        state.containerWidth = containerWidth;
        state.mainViewGeometry = geometry;
        state.panes = panes;
    });
}
