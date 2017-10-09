
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

export default function (bundle, deps) {

  bundle.use(
    'recorderStart', 'recorderStop',
    'Menu', 'StepperControls'
  );

  function RecorderControlsSelector (state, props) {
    const getMessage = state.get('getMessage');
    const recorder = state.get('recorder');
    const status = recorder.get('status');
    const canStart = status === 'ready';
    const canStop = status === 'recording';
    const canPause = false;
    const isRecording = status === 'recording';
    const elapsed = recorder.get('elapsed') || 0;
    const events = recorder.get('events');
    // const eventCount = events && events.count();
    return {getMessage, canStart, canStop, canPause, isRecording, elapsed};
  }

  class RecorderControls extends React.PureComponent {

    render () {
      const {getMessage, canStart, canStop, canPause, isRecording, elapsed} = this.props;
      return (
        <div className="pane pane-controls clearfix">
          <div className="pane-controls-right">
            <deps.Menu/>
          </div>
          <div className="controls controls-main">
            {canStart &&
              <div>
                <Button onClick={this.onStartRecording} className="float-left">
                  <i className="fa fa-circle" style={{color: '#a01'}}/>
                </Button>
                {" "}{getMessage('START_RECORDING')}
              </div>}
            {canStop &&
              <Button onClick={this.onStopRecording}>
                <i className="fa fa-stop"/>
              </Button>}
            {canPause &&
              <Button onClick={this.onPauseRecording}>
                <i className="fa fa-pause"/>
              </Button>}
            {isRecording &&
              <p>
                <i className="fa fa-clock-o"/>
                {' '}
                {timeFormatter(elapsed)}
              </p>}
          </div>
          <deps.StepperControls enabled={isRecording}/>
        </div>
      );
    }
    onStartRecording = () => {
      this.props.dispatch({type: deps.recorderStart});
    };
    onStopRecording = () => {
      this.props.dispatch({type: deps.recorderStop});
    };
    onPauseRecording = () => {
      // TODO
    };
  }
  bundle.defineView('RecorderControls', RecorderControlsSelector, RecorderControls);

};

function zeroPad2 (n) {
  return ('0'+n).slice(-2);
}

function timeFormatter (ms) {
  let s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  s -= m * 60;
  return zeroPad2(m) + ':' + zeroPad2(s);
}
