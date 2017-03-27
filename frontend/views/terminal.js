
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';
import {Panel} from 'react-bootstrap';

import {writeString} from '../stepper/terminal';

const TerminalView = EpicComponent(self => {

  let terminalElement;

  function refTerminal (element) {
    terminalElement = element;
    self.props.onInit(element && {
      focus: () => element.focus()
    });
  }

  function onKeyDown (event) {
    event.stopPropagation();
    terminalElement.focus();
    let block = false;
    switch (event.keyCode) {
    case 8:
      block = true;
      self.props.onBackspace();
      break;
    case 13:
      block = true;
      self.props.onEnter();
      break;
    }
    if (block) {
      event.preventDefault();
    }
  }

  function onKeyUp (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  function onKeyPress (event) {
    event.stopPropagation();
    event.preventDefault();
    // console.log('press', event.key, event.keyCode);
    self.props.onKeyPress(event.key);
  }

  self.render = function () {
    const {buffer} = self.props;
    const cursor = buffer.get('cursor');
    const ci = cursor.get('line'), cj = cursor.get('column');
    return (
      <div ref={refTerminal} className="terminal" tabIndex="1" onKeyDown={onKeyDown} onKeyUp={onKeyUp} onKeyPress={onKeyPress}>
        {buffer.get('lines').map(function (line, i) {
          return (
            <div key={i} className="terminal-line" style={{width: '720px'}}>
              {line.map(function (cell, j) {
                if (i == ci && j == cj) {
                  return <span key={j} className="terminal-cursor">{cell.get('char')}</span>;
                }
                return <span key={j}>{cell.get('char')}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };
});

export default function (bundle, deps) {

  bundle.use(
    'getStepperDisplay',
    'terminalInit', 'terminalInputKey', 'terminalInputBackspace', 'terminalInputEnter'
  );

  bundle.defineView('TerminalView', TerminalViewSelector, EpicComponent(self => {

    function onTermInit (iface) {
      self.props.dispatch({type: deps.terminalInit, iface});
    }
    function onTermChar (key) {
      if (!self.props.preventInput) {
        self.props.dispatch({type: deps.terminalInputKey, key});
      }
    }
    function onTermBS () {
      if (!self.props.preventInput) {
        self.props.dispatch({type: deps.terminalInputBackspace});
      }
    }
    function onTermEnter () {
      if (!self.props.preventInput) {
        self.props.dispatch({type: deps.terminalInputEnter});
      }
    }

    const renderHeader = function () {
      const {isWaitingOnInput} = self.props;
      return (
        <div className="row">
          <div className="col-sm-12">
            {'Terminal'}
            {isWaitingOnInput &&
              <i className="fa fa-hourglass-o"/>}
          </div>
        </div>
      );
    };

    self.render = function () {
      const {readOnly, preventInput, terminal} = self.props;
      return (
        <Panel header={renderHeader()}>
          <div className="row">
            <div className="col-sm-12">
              <TerminalView buffer={terminal} onInit={onTermInit} onKeyPress={onTermChar} onBackspace={onTermBS} onEnter={onTermEnter} />
            </div>
          </div>
        </Panel>
      );
    };

  }));

  function TerminalViewSelector (state, props) {
    const stepper = deps.getStepperDisplay(state);
    const haveStepper = !!stepper;
    const readOnly = haveStepper || props.preventInput;
    const terminal = writeString(stepper.terminal, stepper.inputBuffer);
    const isWaitingOnInput = stepper.isWaitingOnInput;
    return {readOnly, terminal, isWaitingOnInput};
  }

};
