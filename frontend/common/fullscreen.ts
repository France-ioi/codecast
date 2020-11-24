import React from 'react';
import {Button} from '@blueprintjs/core';
import Immutable from 'immutable';
import {buffers, eventChannel} from 'redux-saga';
import {put, take} from 'redux-saga/effects';

export default function (bundle, deps) {

    bundle.defineAction('enterFullscreen', 'Fullscreen.Enter');
    bundle.defineAction('enterFullscreenSucceeded', 'Fullscreen.Enter.Succeeded');
    bundle.defineAction('enterFullscreenFailed', 'Fullscreen.Enter.Failed');
    bundle.defineAction('leaveFullscreen', 'Fullscreen.Leave');
    bundle.defineAction('leaveFullscreenSucceeded', 'Fullscreen.Leave.Succeeded');
    bundle.defineAction('fullscreenEnabled', 'Fullscreen.Enabled');

    bundle.addReducer('init', function (state, _action) {
        return state.set('fullscreen', Immutable.Map({active: false, enabled: false}));
    });

    bundle.addReducer('enterFullscreenSucceeded', function (state, action) {
        return state.setIn(['fullscreen', 'active'], true);
    });

    bundle.addReducer('enterFullscreenFailed', function (state, action) {
        return state.setIn(['fullscreen', 'enabled'], false);
    });

    bundle.addReducer('leaveFullscreenSucceeded', function (state, action) {
        return state.setIn(['fullscreen', 'active'], false);
    });

    bundle.addReducer('fullscreenEnabled', function (state, action) {
        return state.setIn(['fullscreen', 'enabled'], action.enabled);
    });

    bundle.defineView('FullscreenButton', FullscreenButtonSelector, FullscreenButton);

    const fullscreenMonitorChannel = eventChannel(function (listener) {
        const elem = window.document;

        function onFullscreenChange() {
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
        const isFullscreenEnabled = !!(elem.fullscreenEnabled || elem.msFullscreenEnabled || elem.mozFullScreenEnabled || elem.webkitFullscreenEnabled);
        yield put({type: deps.fullscreenEnabled, enabled: isFullscreenEnabled});
        while (true) {
            let event = yield take(fullscreenMonitorChannel);
            switch (event) {
                case 'on':
                    yield put({type: deps.enterFullscreenSucceeded});
                    break;
                case 'error':
                    yield put({type: deps.enterFullscreenFailed});
                    break;
                case 'off':
                    yield put({type: deps.leaveFullscreenSucceeded});
                    break;
            }
        }
    });

    bundle.addSaga(function* watchEnterFullscreen() {
        while (true) {
            yield take(deps.enterFullscreen);
            var elem = window.document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
        }
    });

    bundle.addSaga(function* watchLeaveFullscreen() {
        while (true) {
            yield take(deps.leaveFullscreen);
            var elem = window.document;
            if (elem.exitFullscreen) {
                elem.exitFullscreen();
            } else if (elem.msExitFullscreen) {
                elem.msExitFullscreen();
            } else if (elem.mozCancelFullScreen) {
                elem.mozCancelFullScreen();
            } else if (elem.webkitExitFullscreen) {
                elem.webkitExitFullscreen();
            }
        }
    })

};

class FullscreenButton extends React.PureComponent {
    render() {
        const {enabled, active, getMessage} = this.props;
        const tooltip = getMessage(active ? 'EXIT_FULLSCREEN' : 'FULLSCREEN');
        return (
            <Button onClick={active ? this._leaveFullscreen : this._enterFullscreen} disabled={!enabled} title={tooltip}
                    icon={active ? 'minimize' : 'fullscreen'}/>
        );
    }

    _enterFullscreen = () => {
        this.props.dispatch({type: this.props.enterFullscreen});
    };
    _leaveFullscreen = () => {
        this.props.dispatch({type: this.props.leaveFullscreen});
    };
}

function FullscreenButtonSelector(state, props) {
    const {enterFullscreen, leaveFullscreen} = state.get('scope');
    const getMessage = state.get('getMessage');
    const fullscreen = state.get('fullscreen');
    const enabled = fullscreen.get('enabled');
    const active = fullscreen.get('active');
    return {enterFullscreen, leaveFullscreen, enabled, active, getMessage};
}
