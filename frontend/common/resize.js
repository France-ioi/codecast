
import {eventChannel, buffers} from 'redux-saga';
import {take, put} from 'redux-saga/effects';

export const mainViewGeometries = [
  {size: 'lg', width: 1140, svgScale: 1.0},
  {size: 'md', width:  940, svgScale: 0.9},
  {size: 'sm', width:  794, svgScale: 0.75},
];

export default function (bundle, deps) {

  bundle.defineAction('windowResized', 'Window.Resized');

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
  bundle.addSaga(function* monitorResize () {
    while (true) {
      let {width, height} = yield take(resizeMonitorChannel);
      yield put({type: deps.windowResized, width, height});
    }
  });


  // Make windowResized update the global state 'size'.
  bundle.addReducer('windowResized', function (state, action) {
    const {width, height} = action;
    const subtitlesPaneEnabled = state.get('subtitlesPaneEnabled');
    let showSubtitlesPane = subtitlesPaneEnabled;
    const mainViewWidth = subtitlesPaneEnabled ? width - 200 : width;
    let geometry;
    for (let index = 0; index < mainViewGeometries.length; index += 1) {
      geometry = mainViewGeometries[index];
      if (geometry.width <= mainViewWidth) {
        break;
      }
    }
    if (!geometry) {
      /* Screen is too small, pick the smallest geometry and hide subtitles. */
      geometry = mainViewGeometries[mainViewGeometries.length - 1];
      showSubtitlesPane = false;
    }
    return state
      .set('mainViewGeometry', geometry)
      .set('showSubtitlesPane', showSubtitlesPane);
  });

};
