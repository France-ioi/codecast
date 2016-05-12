
import React from 'react';
import {Panel} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';
import Editor from '../utils/editor';
import Terminal from '../utils/terminal';

// Actions: name start with an action verb
// Selectors: name start with get
// Reducers: match action names
// Sagas: unnamed
// Views: name starts with an upper case letter

export default function* (deps) {

  yield use(
    'getTranslateState', 'getStepperDisplay',
    'sourceInit', 'sourceEdit', 'sourceSelect', 'sourceScroll',
    'inputInit', 'inputEdit', 'inputSelect', 'inputScroll',
    'StackView', 'DirectivesPane');

  yield defineSelector('MainViewSelector', function (state, props) {
    const translate = deps.getTranslateState(state);
    const diagnostics = translate && translate.get('diagnostics');
    const stepperDisplay = deps.getStepperDisplay(state);
    const haveStepper = !!stepperDisplay;
    const terminal = haveStepper && stepperDisplay.terminal;
    return {diagnostics, haveStepper, terminal};
  });

  yield defineView('MainView', 'MainViewSelector', EpicComponent(self => {

    const onSourceInit = function (editor) {
      self.props.dispatch({type: deps.sourceInit, editor});
    };

    const onSourceSelect = function (selection) {
      self.props.dispatch({type: deps.sourceSelect, selection});
    };

    const onSourceEdit = function (delta) {
      self.props.dispatch({type: deps.sourceEdit, delta});
    };

    const onSourceScroll = function (scrollTop, firstVisibleRow) {
      self.props.dispatch({type: deps.sourceScroll, scrollTop, firstVisibleRow});
    };

    const onInputInit = function (editor) {
      self.props.dispatch({type: deps.inputInit, editor});
    };

    const onInputSelect = function (selection) {
      self.props.dispatch({type: deps.inputSelect, selection});
    };

    const onInputEdit = function (delta) {
      self.props.dispatch({type: deps.inputEdit, delta});
    };

    const onInputScroll = function (scrollTop, firstVisibleRow) {
      self.props.dispatch({type: deps.inputScroll, scrollTop, firstVisibleRow});
    };

    self.render = function () {
      const {diagnostics, haveStepper, terminal} = self.props;
      return (
        <div>
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
