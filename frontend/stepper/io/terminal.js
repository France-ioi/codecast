/* Line-buffered terminal */

import Immutable from 'immutable';
import React from 'react';
import classnames from 'classnames';
import {Panel} from 'react-bootstrap';
import {Icon} from '@blueprintjs/core';
import {takeEvery, select, call} from 'redux-saga/effects';

export default function (bundle, deps) {

  bundle.use(
    'getCurrentStepperState',
    'terminalInit', 'terminalInputKey', 'terminalInputBackspace', 'terminalInputEnter'
  );

  bundle.defineAction('terminalInit', 'Terminal.Init');
  bundle.addReducer('terminalInit', function (state, action) {
    const {iface} = action;
    return state.set('terminal', iface);
  });

  bundle.defineAction('terminalFocus', 'Terminal.Focus');
  bundle.addSaga(function* () {
    yield takeEvery(deps.terminalFocus, function* () {
      const iface = yield select(state => state.get('terminal'));
      if (iface) {
        iface.focus();
      }
    });
  });

  bundle.defineAction('terminalInputNeeded', 'Terminal.Input.Needed');
  bundle.addReducer('terminalInputNeeded', terminalInputNeeded);
  function terminalInputNeeded (state, action) {
    return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
      return {...stepper, isWaitingOnInput: true};
    });
  };

  bundle.defineAction('terminalInputKey', 'Terminal.Input.Key');
  bundle.addReducer('terminalInputKey', terminalInputKey);
  function terminalInputKey (state, action) {
    const {key} = action;
    return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
      return {...stepper, inputBuffer: stepper.inputBuffer + key};
    });
  };

  bundle.defineAction('terminalInputBackspace', 'Terminal.Input.Backspace');
  bundle.addReducer('terminalInputBackspace', terminalInputBackspace);
  function terminalInputBackspace (state) {
    return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
      return {...stepper, inputBuffer: stepper.inputBuffer.slice(0, -1)};
    });
  };

  bundle.defineAction('terminalInputEnter', 'Terminal.Input.Enter');
  bundle.addReducer('terminalInputEnter', terminalInputEnter);
  function terminalInputEnter (state) {
    return state.updateIn(['stepper', 'currentStepperState'], function (stepper) {
      const inputLine = stepper.inputBuffer + '\n'
      const newInput = stepper.input + inputLine;

      let newTerminal;
      let newInputPos = stepper.inputPos;
      if (stepper.platform === 'python') {
        newTerminal = writeString(window.currentPythonRunner._terminal, inputLine);

        /**
         * For when we are in player mode, _futureInputValue is filled with an object that
         * will contain the input value, because we need to read the terminal events first
         * without stopping the skulpt execution.
         */
        if (window.currentPythonRunner._futureInputValue) {
          console.log('PUT_____FUTURE____VALUE____ : ', inputLine.trim());
          window.currentPythonRunner._futureInputValue.value = inputLine.trim();

          // We update the input position yet then.
          newInputPos = window.currentPythonRunner._inputPos + inputLine.length;
          window.currentPythonRunner._inputPos = newInputPos;

          console.log('new inputPos : ', newInputPos);
        }

        window.currentPythonRunner._input = newInput;
        window.currentPythonRunner._terminal = newTerminal;
      } else {
        newTerminal = writeString(stepper.terminal, inputLine);
      }

      if (newTerminal) {
        console.log('t11', newTerminal.toJS().lines[0], newTerminal.toJS().lines[1], newTerminal.toJS().lines[2]);
      }

      return {
        ...stepper,
        inputBuffer: "",
        input: newInput,
        inputPos: newInputPos,
        terminal: newTerminal,
        isWaitingOnInput: false
      };
    });
  };

  bundle.defer(function ({recordApi, replayApi}) {

    recordApi.on(deps.terminalInputNeeded, function* (addEvent, action) {
      yield call(addEvent, 'terminal.wait');
    });
    replayApi.on('terminal.wait', function (replayContext, event) {
      replayContext.state = terminalInputNeeded(replayContext.state);
    });

    recordApi.on(deps.terminalInputKey, function* (addEvent, action) {
      yield call(addEvent, 'terminal.key', action.key);
    });
    replayApi.on('terminal.key', function (replayContext, event) {
      const key = event[2];
      replayContext.state = terminalInputKey(replayContext.state, {key});
    });

    recordApi.on(deps.terminalInputBackspace, function* (addEvent, action) {
      yield call(addEvent, 'terminal.backspace');
    });
    replayApi.on('terminal.backspace', function (replayContext, event) {
      replayContext.state = terminalInputBackspace(replayContext.state);
    });

    recordApi.on(deps.terminalInputEnter, function* (addEvent, action) {
      yield call(addEvent, 'terminal.enter');
    });
    replayApi.on('terminal.enter', function (replayContext, event) {
      replayContext.state = terminalInputEnter(replayContext.state);
    });

  });

  bundle.defineView('TerminalView', TerminalViewSelector, class TerminalView extends React.PureComponent {

    onTermInit = (iface) => {
      this.props.dispatch({type: deps.terminalInit, iface});
    };
    onTermChar = (key) => {
      if (!this.props.preventInput) {
        this.props.dispatch({type: deps.terminalInputKey, key});
      }
    };
    onTermBS = () => {
      if (!this.props.preventInput) {
        this.props.dispatch({type: deps.terminalInputBackspace});
      }
    };
    onTermEnter = () => {
      if (!this.props.preventInput) {
        this.props.dispatch({type: deps.terminalInputEnter});
      }
    };
    renderHeader = () => {
      const {isWaitingOnInput} = this.props;
      return (
        <div className="row">
          <div className="col-sm-12">
            {'Terminal'}
            {isWaitingOnInput &&
              <Icon icon='console'/>}
          </div>
        </div>
      );
    };
    render () {
      const {readOnly, preventInput, terminal, input} = this.props;
      const buffer = terminal && writeString(terminal, input);
      return (
        <Panel>
          <Panel.Heading>{this.renderHeader()}</Panel.Heading>
          <Panel.Body>
            <div className="row">
              <div className="col-sm-12">
                {buffer
                  ? <PureTerminal buffer={buffer} onInit={this.onTermInit} onKeyPress={this.onTermChar} onBackspace={this.onTermBS} onEnter={this.onTermEnter} />
                  : <p>{"no buffer"}</p>}
              </div>
            </div>
          </Panel.Body>
        </Panel>
      );
    }
  });

  function TerminalViewSelector (state, props) {
    const result = {};
    result.readOnly = props.preventInput;
    const stepper = deps.getCurrentStepperState(state);
    if (stepper) {
      console.log('t1');
      result.terminal = stepper.terminal;
      result.input = stepper.inputBuffer;
      result.isWaitingOnInput = stepper.isWaitingOnInput;
    }
    return result;
  }

};

/* pure terminal React component */

class PureTerminal extends React.PureComponent {

  constructor (props) {
    super(props);
    this.terminalElement = null;
  }

  refTerminal = (element) => {
    this.terminalElement = element;
    this.props.onInit(element && {
      focus: () => element.focus()
    });
  };

  onKeyDown = (event) => {
    event.stopPropagation();
    this.terminalElement.focus();
    let block = false;
    switch (event.keyCode) {
    case 8:
      block = true;
      this.props.onBackspace();
      break;
    case 13:
      block = true;
      this.props.onEnter();
      break;
    }
    if (block) {
      event.preventDefault();
    }
  };

  onKeyUp = (event) => {
    event.stopPropagation();
    event.preventDefault();
  };

  onKeyPress = (event) => {
    event.stopPropagation();
    event.preventDefault();
    this.props.onKeyPress(event.key);
  };

  render () {
    const {buffer} = this.props;
    const cursor = buffer.get('cursor');
    const ci = cursor.get('line'), cj = cursor.get('column');
    return (
      <div ref={this.refTerminal} className="terminal" tabIndex="1" onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp} onKeyPress={this.onKeyPress}>
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
  }

}

/* low-level terminal state functions */

export const Cursor = Immutable.Record({line: 0, column: 0});
export const Attrs = Immutable.Record({});
export const Cell = Immutable.Record({char: ' ', attrs: Attrs()});

export const TermBuffer = function (options) {
  options = options || {};
  const width = options.width || 80;
  const height = options.lines || 24;
  const cursor = Cursor({line: 0, column: 0});
  const attrs = Attrs();
  const blankCell = Cell({char: ' ', attrs});
  const blankLine = Immutable.List(Array(width).fill(blankCell));
  const lines = Immutable.List(Array(height).fill(blankLine));
  return Immutable.Map({width, height, cursor, attrs, lines}); // TODO: turn this into a Record
};

export const writeString = function (buffer, str) {
  for (let i = 0; i < str.length; i += 1) {
    buffer = writeChar(buffer, str[i]);
  }
  return buffer;
};

export const writeChar = function (buffer, char) {

  if (char === '\n') {
    return writeNewline(buffer);
  }

  if (char === '\r') {
    // Move the cursor to the beginning of the current line.
    return buffer.setIn(['cursor', 'column'], 0);
  }

  // Write the caracter using the current attributes and
  // move the cursor.
  let cursor = buffer.get('cursor');
  const line = cursor.get('line');
  let column = cursor.get('column');
  const attrs = buffer.get('attrs');
  const cell = Cell({char, attrs});
  buffer = buffer.setIn(['lines', line, column], cell);

  column += 1;
  if (column < buffer.get('width')) {
    cursor = cursor.set('column', column);
    return buffer.set('cursor', cursor);
  }

  return writeNewline(buffer);
};

const writeNewline = function (buffer) {
  // Move the cursor to the beginning of the next line.
  const height = buffer.get('height');
  let cursor = buffer.get('cursor').set('column', 0);
  let line = cursor.get('line') + 1;
  // Scroll by one line if needed.
  if (line === height) {
    const width = buffer.get('width');
    const attrs = buffer.get('attrs');
    const blankCell = Cell({char: ' ', attrs});
    const blankLine = Immutable.List(Array(width).fill(blankCell));
    buffer = buffer.update('lines', lines => lines.shift().push(blankLine));
    line = height - 1;
  }
  cursor = cursor.set('line', line);
  buffer = buffer.set('cursor', cursor);
  return buffer;
};
