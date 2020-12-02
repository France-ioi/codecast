import {buffers, eventChannel} from 'redux-saga';
import {put, take} from 'redux-saga/effects';
import {Map} from 'immutable';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';

export const mainViewGeometries = [
    {size: 'lg', width: 1140, svgScale: 1.0},
    {size: 'md', width: 940, svgScale: 0.9},
    {size: 'sm', width: 794, svgScale: 0.75},
];

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, function (state, _action) {
        return state
            .set('mainViewGeometry', mainViewGeometries[0])
            .set('panes', Map());
    });

    // Make windowResized update the global state 'size'.
    bundle.defineAction(ActionTypes.WindowResized);
    bundle.addReducer(ActionTypes.WindowResized, function (state, action) {
        const {width, height} = action;
        return state.set('windowWidth', width).set('windowHeight', height);
    });

    // Event channel for resize events.
    // Only the most recent event is kept in the buffer.
    const resizeMonitorChannel = eventChannel(function (listener) {
        function onResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;
            listener({width, height});
        }

        window.addEventListener('resize', onResize);
        // Add an initial event to the channel.
        onResize();
        return function () {
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

    bundle.addLateReducer(function updateGeometry(state) {
        if (!state) return state;
        /* Default to the largest geometry, no visible panes. */
        let geometry = mainViewGeometries[0];
        let panes = state.get('panes');
        let viewportTooSmall = false;
        const windowWidth = state.get('windowWidth');
        if (windowWidth) {
            let mainViewWidth = windowWidth;
            /* Account for width of enabled panes. */
            panes = panes.map(pane => {
                if (!pane.get('enabled')) {
                    return pane.set('visible', false)
                }
                mainViewWidth -= pane.get('width') + 10;
                return pane.set('visible', true);
            });
            /* Find the largest main-view geometry that fits the available space. */
            let geometryIndex = 0;
            while (geometry.width > mainViewWidth) {
                geometryIndex += 1;
                if (geometryIndex === mainViewGeometries.length) {
                    /* Screen is too small, use the smallest geometry and hide all panes. */
                    viewportTooSmall = true;
                    panes = panes.map(pane => pane.set('visible', false));
                    break;
                }

                geometry = mainViewGeometries[geometryIndex];
            }
        }
        /* Compute the container width */
        /* XXX is this still needed? */
        let containerWidth = geometry.width;
        panes = panes.map(pane => {
            if (pane.get('visible')) {
                containerWidth += pane.get('width');
            }

            return pane;
        });

        return state
            .set('viewportTooSmall', viewportTooSmall)
            .set('containerWidth', containerWidth)
            .set('mainViewGeometry', geometry)
            .set('panes', panes);
    });
};
