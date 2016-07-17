
import {eventChannel, buffers} from 'redux-saga';
import {take, put} from 'redux-saga/effects';

import {defineAction, addSaga, addReducer} from '../utils/linker';

export default function* (deps) {

  yield defineAction('windowResized', 'Window.Resized');

  // Event channel for resize events.
  // Only the most recent event is kept in the buffer.
  const resizeMonitorChannel = eventChannel(function (listener) {
    function onResize () {
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
  yield addSaga(function* monitorResize () {
    while (true) {
      let {width, height} = yield take(resizeMonitorChannel);
      yield put({type: deps.windowResized, width, height});
    }
  });

  // Make windowResized update the global state 'size'.
  yield addReducer('windowResized', function (state, action) {
    const {width, height} = action;
    const size =
      width <  800 ? 'xs' :
      width < 1024 ? 'sm' :
      width < 1200 ? 'md' : 'lg';
    const scale = width < 1024 ? 0.75 : 1;
    return state.set('size', size).set('scale', scale);
  });

};
