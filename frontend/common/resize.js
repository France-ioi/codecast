
import {eventChannel, buffers} from 'redux-saga';
import {take, put} from 'redux-saga/effects';
import Immutable from 'immutable';

export const mainViewGeometries = [
  {size: 'lg', width: 1140, svgScale: 1.0},
  {size: 'md', width:  940, svgScale: 0.9},
  {size: 'sm', width:  794, svgScale: 0.75},
];

export default function (bundle, deps) {

  bundle.addReducer('init', function (state, _action) {
    return state
      .set('mainViewGeometry', mainViewGeometries[0])
      .set('panes', Immutable.Map());
  });

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
    const {width} = action;
    return state.set('windowWidth', width);
  });

  bundle.addLateReducer(function updateGeometry (state) {
    if (!state) return state;
    /* Default to the largest geometry, no visible panes. */
    let geometry = mainViewGeometries[0];
    let panes = state.get('panes');
    const windowWidth = state.get('windowWidth');
    if (windowWidth) {
      let mainViewWidth = windowWidth;
      /* Account for width of enabled panes. */
      panes = panes.map(pane => {
        if (!pane.get('enabled')) {
          return pane.set('visible', false)
        }
        mainViewWidth -= pane.get('width');
        return pane.set('visible', true);
      });
      /* Find the largest main-view geometry that fits the available space. */
      let geometryIndex = 0;
      while (geometry.width > mainViewWidth) {
        geometryIndex += 1;
        if (geometryIndex === mainViewGeometries.length) {
          /* Screen is too small, use the smallest geometry and hide all panes. */
          panes = panes.map(pane => pane.set('visible', false));
          break;
        }
        geometry = mainViewGeometries[geometryIndex];
      }
    }
    return state
      .set('mainViewGeometry', geometry)
      .set('panes', panes);
  });

};
