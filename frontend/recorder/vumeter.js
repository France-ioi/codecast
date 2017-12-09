
import React from 'react';

class Vumeter extends React.PureComponent {
  render() {
    return <canvas id="vumeter" width="10" height="100"></canvas>;
  }
}

export default function (bundle, deps) {

  bundle.addSaga(function* () {
    let vumeterTask;
    yield takeEvery(deps.recorderStopped, vumeterCleanupSaga);
    yield takeEvery(deps.recorderPreparing, function* ({payload: {analyser}}) {
      if (!analyser) return;
      yield call(vumeterCleanupSaga);
      vumeterTask = yield fork(vumeterMonitorSaga, analyser);
    });
    function* vumeterMonitorSaga (analyser) {
      // Set up the ScriptProcessor to divert all buffers to the worker.
      const vumeterElement = document.getElementById('vumeter');
      const canvasContext = vumeterElement.getContext("2d");
      const vumeterData = new Uint8Array(analyser.frequencyBinCount);
      periodically(function* () {
        // Get analyser data and update vumeter.
        analyser.getByteFrequencyData(vumeterData);
        let sum = 0, i;
        for (i = 0; i < vumeterData.length; i++) {
          sum += vumeterData[i];
        }
        const average = sum / vumeterData.length;
        canvasContext.fillStyle = '#dddddd';
        canvasContext.fillRect(0, 0, 10, 100);
        canvasContext.fillStyle = '#00ff00';
        canvasContext.fillRect(0, 100 - average, 10, 100);
      });
    }
    function* vumeterCleanupSaga () {
      if (vumeterTask) {
        yield cancel(vumeterTask);
        vumeterTask = null;
      }
    }
  });
  bundle.defineView('Vumeter', Vumeter);

};
