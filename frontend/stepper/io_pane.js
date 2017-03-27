
import React from 'react';
import {Panel} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import Editor from '../buffers/editor';

export default function (bundle, deps) {

  bundle.use(
    'getStepperDisplay', 'TerminalView', 'BufferEditor'
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
  bundle.addReducer('ioPaneModeChanged', function (state, action) {
    return ioPaneModeChanged(state, action);
  });

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
                      <option value={p.value}>{p.label}</option>)}
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
          <div className="col-sm-6">Sortie</div>
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

};

export function ioPaneModeChanged (state, action) {
  const {mode} = action;
  return state.set('ioPaneMode', mode);
}
