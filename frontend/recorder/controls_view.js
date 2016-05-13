
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  yield use(
    'recorderStop',
    'StepperControls', 'FullscreenButton'
  );

  yield defineSelector('RecorderControlsSelector', function (state, props) {
    const recorder = state.get('recorder');
    const status = recorder.get('status');
    const isRecording = status === 'recording';
    const elapsed = Math.round(recorder.get('elapsed') / 1000) || 0;
    const eventCount = recorder.get('events').count();
    return {isRecording, elapsed, eventCount};
  });


  yield defineView('RecorderControls', 'RecorderControlsSelector', EpicComponent(self => {

    const onStopRecording = function () {
      self.props.dispatch({type: deps.recorderStop});
    };

    const onPauseRecording = function () {
      // TODO
    };

    self.render = function () {
      // recorder
      const {isRecording, elapsed, eventCount} = self.props;
      return (
        <div className="pane pane-controls">
          <Button onClick={onStopRecording} disabled={!isRecording}>
            <i className="fa fa-stop"/>
          </Button>
          {false && <Button onClick={onPauseRecording} disabled={!isRecording}>
            <i className="fa fa-pause"/>
          </Button>}
          <deps.FullscreenButton/>
          {' '}
          <span><i className="fa fa-clock-o"/> {elapsed}s</span>
          {' '}
          <span><i className="fa fa-bolt"/> {eventCount}</span>
          <deps.StepperControls enabled={true}/>
        </div>
      );
    };

  }));

};
