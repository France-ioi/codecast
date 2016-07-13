
import React from 'react';
import {Panel} from 'react-bootstrap';
import classnames from 'classnames';
import EpicComponent from 'epic-component';

import {use, defineSelector, defineView} from '../utils/linker';
import {ShowVar} from './utils';
import {Array1D} from './array1d';
import {Array2D} from './array2d';

export default function* (deps) {

  yield use('stepperViewControlsChanged');

  yield defineSelector('DirectivesPaneSelector', function (state, props) {
    return {state: state.getIn(['stepper', 'display'])};
  });

  yield defineView('DirectivesPane', 'DirectivesPaneSelector', EpicComponent(self => {

    const directiveViewDict = {showVar: ShowVar, showArray: Array1D};

    const onControlsChange = function (directive, update) {
      const {key} = directive;
      self.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
    };

    self.render = function () {
      const {state} = self.props;
      if (!state || !state.analysis) {
        return false;
      }
      const {core, analysis, controls, directives} = state;
      const {ordered, framesMap} = directives;
      const focusDepth = controls.getIn(['stack', 'focusDepth'], 0);
      const context = {core};
      const renderDirective = function (directive) {
        const {key, kind} = directive;
        const View = directiveViewDict[kind];
        return (
          <div key={key} className='directive-view clearfix'>
            <Panel className="directive" header={key}>
              {View
                ? <View directive={directive} controls={controls.get(key)}
                        frames={framesMap[key]} context={context}
                        onChange={onControlsChange} />
                : <p>{`undefined view kind ${kind}`}</p>}
            </Panel>
          </div>
        );
      };
      return (
        <div className='directive-pane'>
          {ordered.map(renderDirective)}
        </div>
      );
    };

  }));

};
