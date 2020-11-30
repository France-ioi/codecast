import Immutable from 'immutable';
import {buffers, eventChannel} from 'redux-saga';
import {put, take} from 'redux-saga/effects';
import {ActionTypes} from "./actionTypes";
import {FullscreenButton} from "./FullscreenButton";

export default function (bundle, deps) {
    bundle.addReducer('init', function (state, _action) {
        return state.set('fullscreen', Immutable.Map({active: false, enabled: false}));
    });

    bundle.defineAction(ActionTypes.FullscreenEnter);

    bundle.defineAction(ActionTypes.FullscreenEnterSucceeded);
    bundle.addReducer(ActionTypes.FullscreenEnterSucceeded, function (state, action) {
        return state.setIn(['fullscreen', 'active'], true);
    });

    bundle.defineAction(ActionTypes.FullscreenEnterFailed);
    bundle.addReducer(ActionTypes.FullscreenEnterFailed, function (state, action) {
        return state.setIn(['fullscreen', 'enabled'], false);
    });

    bundle.defineAction(ActionTypes.FullscreenLeave);

    bundle.defineAction(ActionTypes.FullscreenLeaveSucceeded);
    bundle.addReducer(ActionTypes.FullscreenLeaveSucceeded, function (state, action) {
        return state.setIn(['fullscreen', 'active'], false);
    });

    bundle.defineAction(ActionTypes.FullscreenEnabled);
    bundle.addReducer(ActionTypes.FullscreenEnabled, function (state, action) {
        return state.setIn(['fullscreen', 'enabled'], action.enabled);
    });

    bundle.defineView('FullscreenButton', FullscreenButtonSelector, FullscreenButton);

    const fullscreenMonitorChannel = eventChannel(function (listener) {
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
        return function () {
            elem.removeEventListener('fullscreenchange', onFullscreenChange);
            elem.removeEventListener('mozfullscreenchange', onFullscreenChange);
            elem.removeEventListener('webkitfullscreenchange', onFullscreenChange);
            elem.removeEventListener('fullscreenerror', onFullscreenError);
            elem.removeEventListener('mozfullscreenerror', onFullscreenError);
            elem.removeEventListener('webkitfullscreenerror', onFullscreenError);
        }
    }, buffers.sliding(3));

    bundle.addSaga(function* monitorFullscreen() {
        const elem = window.document;
        // @ts-ignore
        const isFullscreenEnabled = !!(elem.fullscreenEnabled || elem.msFullscreenEnabled || elem.mozFullScreenEnabled || elem.webkitFullscreenEnabled);
        yield put({type: ActionTypes.FullscreenEnabled, enabled: isFullscreenEnabled});
        while (true) {
            let event = yield take(fullscreenMonitorChannel);
            switch (event) {
                case 'on':
                    yield put({type: ActionTypes.FullscreenEnterSucceeded});
                    break;
                case 'error':
                    yield put({type: ActionTypes.FullscreenEnterFailed});
                    break;
                case 'off':
                    yield put({type: ActionTypes.FullscreenLeaveSucceeded});
                    break;
            }
        }
    });

    bundle.addSaga(function* watchEnterFullscreen() {
        while (true) {
            yield take(deps.enterFullscreen);
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
            yield take(deps.leaveFullscreen);
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

function FullscreenButtonSelector(state, props) {
    const getMessage = state.get('getMessage');
    const fullscreen = state.get('fullscreen');
    const enabled = fullscreen.get('enabled');
    const active = fullscreen.get('active');

    return {enabled, active, getMessage};
}
