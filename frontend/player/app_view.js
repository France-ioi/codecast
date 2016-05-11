
import React from 'react';
import EpicComponent from 'epic-component';
import {Button, Panel} from 'react-bootstrap';

import {use, defineSelector, defineView} from '../utils/linker';

import Editor from '../utils/editor';
import Terminal from '../utils/terminal';

export default function* (deps) {

  yield use(
    'playerStart', 'playerResume', 'playerPause',
    'playerSourceInit', 'playerInputInit',
    'StackView', 'DirectivesPane'
  );

  yield defineSelector('AppSelector', function (state, props) {
    const player = state.get('player');
    const lastError = state.get('lastError');
    const playerState = player.get('state');
    const current = player.get('current');
    return {lastError, playerState, current};
  });

  yield defineView('App', 'AppSelector', EpicComponent(self => {

    const onPlay = function () {
      const {playerState} = self.props;
      if (playerState === 'ready') {
        self.props.dispatch({type: deps.playerStart});
      } else if (playerState === 'paused') {
        self.props.dispatch({type: deps.playerResume});
      }
    };

    const onPause = function () {
      self.props.dispatch({type: deps.playerPause});
    };

    const onSourceInit = function (editor) {
      self.props.dispatch({type: deps.playerSourceInit, editor});
    };

    const onSourceEdit = function () {
      // TODO
    };

    const onSourceSelect = function () {
      // TODO
    };

    const onSourceScroll = function () {
      // TODO
    };

    const onInputInit = function (editor) {
      self.props.dispatch({type: deps.playerInputInit, editor});
    };

    const onInputEdit = function () {
      // TODO
    };

    const onInputSelect = function () {
      // TODO
    };

    const onInputScroll = function () {
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
      const source = currentState && currentState.get('source');
      const input = currentState && currentState.get('input');
      const stepperDisplay = currentState && currentState.get('stepper');
      const haveStepper = !!stepperDisplay;
      const terminal = stepperDisplay && stepperDisplay.terminal;
      const diagnostics = false; // TODO
      return (
        <div className="container">
          <div className="row">
            <div className="col-md-12">
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
              {lastError && <p>{JSON.stringify(lastError)}</p>}
            </div>
          </div>
          <div className="row">
            <div className="col-md-3">
              <Panel header="Variables">
                {<deps.StackView height='280px'/>}
              </Panel>
            </div>
            <div className="col-md-9">
              <Panel header="Source">
                <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect} onScroll={onSourceScroll}
                        readOnly={haveStepper} mode='c_cpp' width='100%' height='280px' />
              </Panel>
            </div>
          </div>
          <div className="row">
            {diagnostics && <div className="col-md-12">
              <Panel header="Messages">
                <div dangerouslySetInnerHTML={diagnostics}/>
              </Panel>
            </div>}
            <div className="col-md-12">
              <deps.DirectivesPane/>
              <Panel header="Entrée/Sortie">
                <div className="row">
                  <div className="col-md-6">
                    <Editor onInit={onInputInit} onEdit={onInputEdit} onSelect={onInputSelect} onScroll={onInputScroll}
                            readOnly={haveStepper} mode='text' width='100%' height='168px' />
                  </div>
                  <div className="col-md-6">
                    {terminal
                      ? <Terminal terminal={terminal}/>
                      : <p>Programme arrêté, pas de sortie à afficher.</p>}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      );
    };

  }));

};