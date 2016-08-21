
import React from 'react';
import {Panel, Button} from 'react-bootstrap';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import Immutable from 'immutable';

import {use, defineSelector, defineView} from '../utils/linker';
import {ShowVar} from './utils';
import {Array1D} from './array1d';
import {Array2D} from './array2d';
import {SortView} from './sort';

export default function* (deps) {

  yield use('stepperViewControlsChanged', 'getStepperDisplay');

  yield defineSelector('DirectivesPaneSelector', function (state, props) {
    const stepperState = deps.getStepperDisplay(state);
    const scale = state.get('scale');
    return {state: stepperState, scale};
  });

  const DirectiveFrame = EpicComponent(self => {

    const onToggleFullView = function () {
      const {controls} = self.props;
      const update = {fullView: !controls.get('fullView')};
      self.props.onChange(self.props.directive, update);
    };

    self.render = function () {
      const {directive, controls, title, hasFullView} = self.props;
      const {key} = directive;
      const fullView = controls.get('fullView');
      const header = (
        <div className="directive-header">
          <div className="pull-right">
            {hasFullView &&
              <Button onClick={onToggleFullView} bsSize="xs">
                {fullView ? 'min' : 'max'}
              </Button>}
          </div>
          <div className="directive-title">
            {title || key}
          </div>
        </div>);
      return (
        <div key={key} className='directive-view clearfix'>
          <Panel className="directive" header={header}>
            {self.props.children}
          </Panel>
        </div>
      );
    };

  });

  yield defineView('DirectivesPane', 'DirectivesPaneSelector', EpicComponent(self => {

    const directiveViewDict = {
      showVar: ShowVar,
      showArray: Array1D,
      showArray2D: Array2D,
      showSort: SortView
    };

    const onControlsChange = function (directive, update) {
      const {key} = directive;
      self.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
    };

    self.render = function () {
      const {state, scale} = self.props;
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
        if (!View) {
          return <Directive key={key} title={`undefined view kind ${kind}`}/>;
        }
        return (
          <View Frame={DirectiveFrame} directive={directive} controls={controls.get(key, Immutable.Map())}
            frames={framesMap[key]} context={context}
            onChange={onControlsChange} scale={scale} />);
      };
      return (
        <div className='directive-pane'>
          {ordered.map(renderDirective)}
        </div>
      );
    };

  }));

};
