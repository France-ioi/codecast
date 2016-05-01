
import React from 'react';
import EpicComponent from 'epic-component';
import {Button} from 'react-bootstrap';

import Editor from '../common/editor';
import Terminal from '../common/terminal';
import StackView from '../stepper/stack_view';
import DirectivesPane from '../stepper/directives_pane';

export default actions => EpicComponent(self => {

  const onPlay = function () {
    const {playerState} = self.props;
    if (playerState === 'ready') {
      self.props.dispatch({type: actions.playerStart});
    } else if (playerState === 'paused') {
      self.props.dispatch({type: actions.playerResume});
    }
  };

  const onPause = function () {
    self.props.dispatch({type: actions.playerPause});
  };

  const onSourceInit = function (editor) {
    self.props.dispatch({type: actions.playerSourceInit, editor});
  };

  const onSourceEdit = function () {
    // TODO
  };

  const onSourceSelect = function () {
    // TODO
  };

  const onInputInit = function (editor) {
    self.props.dispatch({type: actions.playerInputInit, editor});
  };

  const onInputEdit = function () {
    // TODO
  };

  const onInputSelect = function () {
    // TODO
  };

  const onEnterFullScreen = function () {
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
    const {playerState, lastError, current} = self.props;
    const currentState = current && current.state;
    const source = current && currentState.get('source');
    const stepper = current && currentState.get('stepper');
    const terminal = stepper && stepper.terminal;
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-3">
            {lastError && <p>{JSON.stringify(lastError)}</p>}
          </div>
          <div className="col-md-6">
            {/preparing|starting|ready|paused/.test(playerState) &&
              <Button onClick={onPlay} enabled={/ready|paused/.test(playerState)}>
                <i className="fa fa-play"/>
              </Button>}
            {/playing|pausing/.test(playerState) &&
              <Button onClick={onPause} enabled={playerState === 'playing'}>
                <i className="fa fa-pause"/>
              </Button>}
            <Button onClick={onEnterFullScreen}>mode plein écran</Button>
            <span>{playerState}</span>
          </div>
          <div className="col-md-3">
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            {stepper &&
              <div>
                <h2>Pile</h2>
                <StackView state={stepper}/>
              </div>}
          </div>
          <div className="col-md-9">
            <h2>Source C</h2>
            <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect}
                    mode='c_cpp' readOnly={true} width='100%' height='336px' />
          </div>
        </div>
        <div className="row">
          {stepper && <div className="col-md-12">
            <h2>Vues</h2>
            <DirectivesPane state={stepper}/>
          </div>}
        </div>
        <div className="row">
          <div className="col-md-6">
            <h2>Entrée du programme</h2>
            <Editor onInit={onInputInit} onEdit={onInputEdit} onSelect={onInputSelect}
                    mode='text' readOnly={true} width='100%' height='336px' />
          </div>
          <div className="col-md-6">
            {terminal &&
              <div>
                <h2>Terminal</h2>
                <Terminal terminal={terminal}/>
              </div>}
          </div>
        </div>
      </div>
    );
  };

});
