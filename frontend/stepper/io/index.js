
import React from 'react';
import {Panel} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import {select, call, put} from 'redux-saga/effects';
import * as C from 'persistent-c';

import Editor from '../../buffers/editor';
import {documentFromString} from '../../buffers/document';
import {DocumentModel} from '../../buffers/index';
import {writeString} from './terminal';
import {printfBuiltin} from './printf';
import {scanfBuiltin} from './scanf';

export default function (bundle, deps) {

  bundle.use(
    'TerminalView', 'BufferEditor',
    'getStepperDisplay', 'stepperProgress', 'stepperIdle',
    'stepperRestart', 'stepperUndo', 'stepperRedo',
    'getBufferModel', 'bufferReset', 'bufferEdit', 'bufferModelEdit', 'bufferModelSelect'
  );

  bundle.addReducer('init', function (state) {
    return state.set('ioPaneMode', 'split');
  });

  bundle.defineView('IOPane', IOPaneSelector, EpicComponent(self => {

    self.render = function () {
      switch (self.props.mode) {
        case 'terminal': return <deps.TerminalView {...self.props}/>;
        case 'split': return <deps.InputOutputView {...self.props}/>;
        default: return <deps.IOPaneOptions/>;
      }
    };

  }));

  function IOPaneSelector (state, props) {
    const stepper = deps.getStepperDisplay(state);
    let mode = 'options';
    if (stepper) {
      if (stepper.terminal) {
        mode = 'terminal';
      } else {
        mode = 'split';
      }
    }
    return {mode};
  }

  /* Options view */

  bundle.defineAction('ioPaneModeChanged', 'IOPane.Mode.Changed');
  bundle.addReducer('ioPaneModeChanged', ioPaneModeChanged);
  function ioPaneModeChanged (state, action) {
    const {mode} = action;
    return state.set('ioPaneMode', mode);
  }

  bundle.defineSelector('getIoPaneMode', function (state) {
    return state.get('ioPaneMode');
  })

  bundle.defineView('IOPaneOptions', IOPaneOptionsSelector, EpicComponent(self => {

    function onModeChanged (event) {
      const mode = event.target.value;
      self.props.dispatch({type: deps.ioPaneModeChanged, mode});
    }

    const modeOptions = [
      {value: 'split', label: "Entrée/sortie séparés"},
      {value: 'terminal', label: "Terminal interactif"}
    ];

    self.render = function () {
      const {mode} = self.props;
      return (
        <Panel header={'Entrée/Sortie/Terminal'}>
          <div className="row">
            <div className="col-sm-12">
              <form>
                <label>
                  {"Mécanisme d'entrée/sortie : "}
                  <select value={mode} onChange={onModeChanged}>
                    {modeOptions.map(p =>
                      <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </label>
              </form>
              {mode === 'split' &&
                <div>
                  <p>{"Entrée initiale : "}</p>
                  <deps.BufferEditor buffer='input' mode='text' width='100%' height='150px' />
                </div>}
            </div>
          </div>
        </Panel>
      );
    };

  }));

  function IOPaneOptionsSelector (state) {
    const mode = deps.getIoPaneMode(state);
    return {mode};
  }

  /* Split input/output view */

  bundle.defineView('InputOutputView', InputOutputViewSelector, EpicComponent(self => {

    const renderHeader = function () {
      return (
        <div className="row">
          <div className="col-sm-6">
            {'Entrée '}
            <i className="fa fa-lock"/>
          </div>
          <div className="col-sm-6">{"Sortie"}</div>
        </div>
      );
    };

    self.render = function () {
      const {readOnly, preventInput} = self.props;
      return (
        <Panel header={renderHeader()}>
          <div className="row">
            <div className="col-sm-6">
              <deps.BufferEditor buffer='input' readOnly={true} mode='text' width='100%' height='150px' />
            </div>
            <div className="col-sm-6">
              <deps.BufferEditor buffer='output' readOnly={true} shield={true} mode='text' width='100%' height='150px' />
            </div>
          </div>
        </Panel>
      );
    };

  }));

  function InputOutputViewSelector (state, props) {
    const stepper = deps.getStepperDisplay(state);
    const {output} = stepper;
    return {output};
  }

  /* TODO: move reflectToOutput code here */
  bundle.defineSelector('getOutputBufferModel', function (state) {
    const stepper = deps.getStepperDisplay(state);
    const {output} = stepper;
    const doc = documentFromString(output);
    const endCursor = doc.endCursor();
    const model = DocumentModel({
      document: doc,
      selection: {start: endCursor, end: endCursor},
      firstVisibleRow: endCursor.row
    });
    return model;
  });

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    recordApi.onStart(function* (init) {
      init.ioPaneMode = yield select(deps.getIoPaneMode)
    });
    replayApi.on('start', function (context, event, instant) {
      const init = event[2];
      context.state = context.state.set('ioPaneMode', init.ioPaneMode);
    });

    recordApi.on(deps.ioPaneModeChanged, function* (addEvent, action) {
      yield call(addEvent, 'ioPane.mode', action.mode);
    });
    replayApi.on('ioPane.mode', function (context, event, instant) {
      const mode = event[2];
      context.state = ioPaneModeChanged(context.state, {mode});
    });

    replayApi.on(['stepper.restart', 'stepper.undo', 'stepper.redo'], function (context, event, instant) {
      if (context.state.get('ioPaneMode') === 'split') {
        context.state = syncOutputBuffer(context.state); /* TODO: avoid this by
          making sure the output buffer model is kept consistent */
        instant.saga = syncOutputBufferSaga;
      }
    });

    replayApi.onReset(function* (instant) {
      const ioPaneMode = instant.state.get('ioPaneMode');
      yield put({type: deps.ioPaneModeChanged, mode: ioPaneMode});
    });

    stepperApi.addOptions(function (options, state) {
      const ioPaneMode = state.get('ioPaneMode');
      if (ioPaneMode === 'terminal') {
        options.terminal = true; /* TODO: store terminal size? */
      } else {
        const inputModel = deps.getBufferModel(state, 'input');
        options.input = inputModel.get('document').toString();
      }
    });

    /* Set up the terminal or input. */
    stepperApi.onInit(function (state) {
      const {options} = state;
      if (options.terminal) {
        state.inputPos = 0;
        state.input = "";
        state.terminal = new TermBuffer({lines: 10, width: 80});
      } else {
        let input = (options.input || "").trimRight();
        if (input.length !== 0) {
          input = input + "\n";
        }
        state.inputPos = 0;
        state.input = input;
        state.output = "";
      }
      state.inputBuffer = "";
    });

    stepperApi.addBuiltin('printf', printfBuiltin);

    stepperApi.addBuiltin('putchar', function* putcharBuiltin (context, charCode) {
      const ch = String.fromCharCode(charCode.toInteger());
      yield ['write', ch];
      yield ['result', charCode];
    });

    stepperApi.addBuiltin('puts', function* putsBuiltin (context, strRef) {
      const str = C.readString(context.state.memory, strRef) + '\n';
      yield ['write', str];
      const result = new C.IntegralValue(C.builtinTypes['int'], 0);
      yield ['result', result];
    });

    stepperApi.addBuiltin('scanf', scanfBuiltin);

    stepperApi.onEffect('write', function* writeEffect (context, text) {
      const {state} = context;
      if (state.terminal) {
        state.terminal = writeString(state.terminal, text);
      } else {
        state.output = state.output + text;
      }
    });

    stepperApi.addBuiltin('gets', function* getsBuiltin (context, ref) {
      const line = yield ['gets'];
      let result = C.nullPointer;
      if (line !== null) {
        const value = new C.stringValue(line);
        yield ['store', ref, value];
        result = ref;
      }
      yield ['result', result];
    });

    stepperApi.addBuiltin('getchar', function* getcharBuiltin (context) {
      const line = yield ['gets'];
      let result;
      if (line === null) {
        result = -1;
      } else {
        result = line.charCodeAt(0);
        yield ['ungets', line.length - 1];
      }
      yield ['result', new C.IntegralValue(C.builtinTypes['int'], result)];
    });

    stepperApi.onEffect('gets', function* getsEffect (context) {
      const {state} = context;
      const {input, inputPos} = state;
      var nextNL = input.indexOf('\n', inputPos);
      if (-1 === nextNL) {
        if (!state.terminal || !context.interactive) {
          /* non-interactive, end of input */
          return null;
        }
        /* Set the isWaitingOnInput flag on the state. */
        yield put({type: deps.terminalInputNeeded});
        /* Transfer focus to the terminal. */
        yield put({type: deps.terminalFocus});
        const {interrupted} = yield (race({
          completed: take(deps.terminalInputEnter),
          interrupted: take(deps.stepperInterrupt)
        }));
        if (interrupted) {
          throw 'interrupted';
        }
        throw 'retry';
      }
      const line = input.substring(inputPos, nextNL);
      state.inputPos = nextNL + 1;
      return line;
    });

    stepperApi.onEffect('ungets', function* ungetsHandler (context, count) {
      context.state.inputPos -= count;
    });

    stepperApi.addSaga(function* (options) {
      if (!options.terminal) {
        yield call(reflectToOutput);
      }
    });

  });

  function* reflectToOutput () {
    /* Incrementally add text produced by the stepper to the output buffer. */
    /* TODO: move this code into io/buffers */
    yield takeLatest([deps.stepperProgress, deps.stepperIdle], function* (action) {
      const stepperState = yield select(deps.getStepperDisplay);
      const outputModel = yield select(deps.getBufferModel, 'output');
      const oldSize = outputModel.get('document').size();
      const newSize = stepperState.output.length;
      if (oldSize !== newSize) {
        const outputDoc = outputModel.get('document');
        const endCursor = outputDoc.endCursor();
        const delta = {
          action: 'insert',
          start: endCursor,
          end: endCursor,
          lines: stepperState.output.substr(oldSize).split('\n')
        };
        /* Update the model to maintain length, new end cursor. */
        yield put({type: deps.bufferEdit, buffer: 'output', delta});
        const newEndCursor = yield select(state => deps.getBufferModel(state, 'output').get('document').endCursor());
        /* Send the delta to the editor to add the new output. */
        yield put({type: deps.bufferModelEdit, buffer: 'output', delta});
        /* Move the cursor to the end of the buffer. */
        yield put({type: deps.bufferModelSelect, buffer: 'output', selection: {start: newEndCursor, end: newEndCursor}});
      }
    });
    /* Reset the output document. */
    yield takeEvery([deps.stepperRestart, deps.stepperUndo, deps.stepperRedo], function* () {
      const model = yield select(deps.getOutputBufferModel);
      yield put({type: deps.bufferReset, buffer: 'output', model});
    });
  }

  function syncOutputBuffer (state) {
    const model = deps.getOutputBufferModel(state);
    return state.setIn(['buffers', 'output', 'model'], model);
  }

  function* syncOutputBufferSaga (instant) {
    const model = instant.state.getIn(['buffers', 'output', 'model']);
    yield put({type: deps.bufferReset, buffer: 'output', model});
  }

};
