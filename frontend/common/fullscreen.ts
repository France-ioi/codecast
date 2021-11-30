import {buffers, eventChannel} from 'redux-saga';
import {put, take} from 'typed-redux-saga';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from '../actionTypes';
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {App} from "../index";

export const initialStateFullscreen = {
    active: false,
    enabled: false
};

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.fullscreen = {...initialStateFullscreen};
    });

    bundle.defineAction(ActionTypes.FullscreenEnter);

    bundle.defineAction(ActionTypes.FullscreenEnterSucceeded);
    bundle.addReducer(ActionTypes.FullscreenEnterSucceeded, (state: AppStore) => {
        state.fullscreen.active = true;
    });

    bundle.defineAction(ActionTypes.FullscreenEnterFailed);
    bundle.addReducer(ActionTypes.FullscreenEnterFailed, (state: AppStore) => {
        state.fullscreen.enabled = false;
    });

    bundle.defineAction(ActionTypes.FullscreenLeave);

    bundle.defineAction(ActionTypes.FullscreenLeaveSucceeded);
    bundle.addReducer(ActionTypes.FullscreenLeaveSucceeded, (state: AppStore) => {
        state.fullscreen.active = false;
    });

    bundle.defineAction(ActionTypes.FullscreenEnabled);
    bundle.addReducer(ActionTypes.FullscreenEnabled, (state: AppStore, action) => {
        state.fullscreen.enabled = action.enabled;
    });

    const fullscreenMonitorChannel = eventChannel(function(listener) {
        const elem = window.document;

        function onFullscreenChange() {
            // @ts-ignore
            const isFullscreen = !!(elem.fullscreenElement || elem.msFullscreenElement || elem.mozFullScreenElement || elem.webkitFullscreenElement);
            listener(isFullscreen ? 'on' : 'off');
        }

        function onFullscreenError() {
            listener('error');
        }

        elem.addEventListener('fullscreenchange', onFullscreenChange);
        elem.addEventListener('mozfullscreenchange', onFullscreenChange);
        elem.addEventListener('webkitfullscreenchange', onFullscreenChange);
        elem.addEventListener('fullscreenerror', onFullscreenError);
        elem.addEventListener('mozfullscreenerror', onFullscreenError);
        elem.addEventListener('webkitfullscreenerror', onFullscreenError);
        return function() {
            elem.removeEventListener('fullscreenchange', onFullscreenChange);
            elem.removeEventListener('mozfullscreenchange', onFullscreenChange);
            elem.removeEventListener('webkitfullscreenchange', onFullscreenChange);
            elem.removeEventListener('fullscreenerror', onFullscreenError);
            elem.removeEventListener('mozfullscreenerror', onFullscreenError);
            elem.removeEventListener('webkitfullscreenerror', onFullscreenError);
        }
    }, buffers.sliding(3));

    bundle.addSaga(function* monitorFullscreen(app: App) {
        if ('main' !== app.environment) {
            return;
        }

        const elem = window.document;
        // @ts-ignore
        const isFullscreenEnabled = !!(elem.fullscreenEnabled || elem.msFullscreenEnabled || elem.mozFullScreenEnabled || elem.webkitFullscreenEnabled);
        yield* put({type: ActionTypes.FullscreenEnabled, enabled: isFullscreenEnabled});
        while (true) {
            let event = yield* take(fullscreenMonitorChannel);
            switch (event) {
                case 'on':
                    yield* put({type: ActionTypes.FullscreenEnterSucceeded});
                    break;
                case 'error':
                    yield* put({type: ActionTypes.FullscreenEnterFailed});
                    break;
                case 'off':
                    yield* put({type: ActionTypes.FullscreenLeaveSucceeded});
                    break;
            }
        }
    });

    bundle.addSaga(function* watchEnterFullscreen() {
        while (true) {
            yield* take(ActionTypes.FullscreenEnter);

            const elem = window.document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
                // @ts-ignore
            } else if (elem.msRequestFullscreen) {
                // @ts-ignore
                elem.msRequestFullscreen();
                // @ts-ignore
            } else if (elem.mozRequestFullScreen) {
                // @ts-ignore
                elem.mozRequestFullScreen();
                // @ts-ignore
            } else if (elem.webkitRequestFullscreen) {
                // @ts-ignore
                elem.webkitRequestFullscreen();
            }
        }
    });

    bundle.addSaga(function* watchLeaveFullscreen() {
        while (true) {
            yield* take(ActionTypes.FullscreenLeave);

            const elem = window.document;
            if (elem.exitFullscreen) {
                elem.exitFullscreen();
                // @ts-ignore
            } else if (elem.msExitFullscreen) {
                // @ts-ignore
                elem.msExitFullscreen();
                // @ts-ignore
            } else if (elem.mozCancelFullScreen) {
                // @ts-ignore
                elem.mozCancelFullScreen();
                // @ts-ignore
            } else if (elem.webkitExitFullscreen) {
                // @ts-ignore
                elem.webkitExitFullscreen();
            }
        }
    })
};
