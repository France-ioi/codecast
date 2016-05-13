
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import {eventChannel, buffers} from 'redux-saga';
import {take, put, select} from 'redux-saga/effects';

import {defineAction, defineSelector, defineView, addReducer, addSaga} from '../utils/linker';

export default function* (deps) {

  yield defineAction('enterFullscreen', 'Fullscreen.Enter');
  yield defineAction('enterFullscreenSucceeded', 'Fullscreen.Enter.Succeeded');
  yield defineAction('enterFullscreenFailed', 'Fullscreen.Enter.Failed');
  yield defineAction('leaveFullscreen', 'Fullscreen.Leave');
  yield defineAction('leaveFullscreenSucceeded', 'Fullscreen.Leave.Succeeded');
  yield defineAction('fullscreenEnabled', 'Fullscreen.Enabled');

  yield addReducer('enterFullscreenSucceeded', function (state, action) {
    return state.setIn(['fullscreen', 'active'], true);
  });

  yield addReducer('enterFullscreenFailed', function (state, action) {
    return state.setIn(['fullscreen', 'enabled'], false);
  });

  yield addReducer('leaveFullscreenSucceeded', function (state, action) {
    return state.setIn(['fullscreen', 'active'], false);
  });

  yield addReducer('fullscreenEnabled', function (state, action) {
    return state.setIn(['fullscreen', 'enabled'], action.enabled);
  });

  yield defineSelector('FullscreenButtonSelector', function (state, props) {
    const fullscreen = state.get('fullscreen');
    const enabled = fullscreen.get('enabled');
    const active = fullscreen.get('active');
    return {enabled, active};
  });

  yield defineView('FullscreenButton', 'FullscreenButtonSelector', EpicComponent(self => {
    const onEnterFullscreen = function () {
      self.props.dispatch({type: deps.enterFullscreen});
    };
    const onLeaveFullscreen = function () {
      self.props.dispatch({type: deps.leaveFullscreen});
    };
    self.render = function () {
      const {enabled, active} = self.props;
      return (
        <Button onClick={active ? onLeaveFullscreen : onEnterFullscreen} disabled={!enabled}>
          <i className={active ? "fa fa-compress" : "fa fa-expand"}/>
        </Button>
      );
    };
  }));

  const fullscreenMonitorChannel = eventChannel(function (listener) {
    const elem = window.document;
    function onFullscreenChange () {
      const isFullscreen = !!(elem.fullscreenElement || elem.msFullscreenElement || elem.mozFullScreenElement || elem.webkitFullscreenElement);
      listener(isFullscreen ? 'on' : 'off');
    }
    function onFullscreenError () {
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

  yield addSaga(function* monitorFullscreen () {
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

  yield addSaga(function* watchEnterFullscreen () {
    while (true) {
      yield take (deps.enterFullscreen);
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

  yield addSaga(function* watchLeaveFullscreen () {
    while (true) {
      yield take (deps.leaveFullscreen);
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
