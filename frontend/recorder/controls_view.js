
import React from 'react';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  yield use(
    'recorderStop',
    'stepperStep', 'stepperInterrupt', 'stepperRestart', 'stepperExit',
    'translate'
  );

  yield defineSelector('ControlsSelector', function (state, props) {
    const recorder = state.get('recorder');
    const recorderState = recorder.get('state');
    const isRecording = recorderState === 'recording';
    const elapsed = Math.round(recorder.get('elapsed') / 1000) || 0;
    const eventCount = recorder.get('events').count();
    const stepper = deps.getStepperState(state);
    const haveStepper = !!stepper;
    const stepperState = haveStepper && stepper.get('state');
    const isStepping = stepperState !== 'idle';
    const stepperDisplay = haveStepper && stepper.get('display');
    const {control} = stepperDisplay || {};
    const canStep = !!(!isStepping && control && control.node);
    return {isRecording, elapsed, eventCount, haveStepper, isStepping, canStep};
  });


  yield defineView('Controls', 'ControlsSelector', EpicComponent(self => {

    // Recorder

    const onPauseRecording = function () {
      // TODO
    };

    const onStopRecording = function () {
      self.props.dispatch({type: deps.recorderStop});  // XXX
    };

    // Player

    const onStartPlayback = function () {
      const {playerState} = self.props;
      if (playerState === 'ready') {
        self.props.dispatch({type: deps.playerStart});
      } else if (playerState === 'paused') {
        self.props.dispatch({type: deps.playerResume});
      }
    };

    const onPausePlayback = function () {
      self.props.dispatch({type: deps.playerPause});
    };

    // All

    const onStepExpr = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'expr'});
    };

    const onStepInto = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'into'});
    };

    const onStepOut = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'out'});
    };

    const onStepOver = function () {
      self.props.dispatch({type: deps.stepperStep, mode: 'over'});
    };

    const onInterrupt = function () {
      self.props.dispatch({type: deps.stepperInterrupt});
    };

    const onRestart = function () {
      self.props.dispatch({type: deps.stepperRestart});
    };

    const onEdit = function () {
      self.props.dispatch({type: deps.stepperExit});
    };

    const onTranslate = function () {
      self.props.dispatch({type: deps.translate});
    };

    const onEnterFullScreen = function () {
      // TODO: replace with action that runs a saga
      var elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
    };

    self.render = function () {
      // recorder
      const {isRecording, elapsed, eventCount} = self.props;
      // player
      const {playerState, lastError, current} = self.props;
      return (
        <div className="pane pane-controls">
          <p>

              {/preparing|starting|ready|paused/.test(playerState) &&
                <Button onClick={onStartPlayback} enabled={/ready|paused/.test(playerState)}>
                  <i className="fa fa-play"/>
                </Button>}
              {/playing|pausing/.test(playerState) &&
                <Button onClick={onPausePlayback} enabled={playerState === 'playing'}>
                  <i className="fa fa-pause"/>
                </Button>}
              <Button onClick={onEnterFullScreen}>mode plein écran</Button>
              <span>{playerState}</span>
              {lastError && <p>{JSON.stringify(lastError)}</p>}

            {false && <Button onClick={onPauseRecording} disabled={!isRecording}>
              <i className="fa fa-pause"/>
            </Button>}
            <Button onClick={onStopRecording} disabled={!isRecording}>
              <i className="fa fa-stop"/>
            </Button>
            <view.StepperControls/>
            {' '}
            <span><i className="fa fa-clock-o"/> {elapsed}s</span>
            {' '}
            <span><i className="fa fa-bolt"/> {eventCount}</span>
          </p>
        </div>
      );
    };

  }));

};
