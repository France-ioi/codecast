
import React from 'react';
import {Panel, Button, Navbar, Nav, NavItem} from 'react-bootstrap';
import classnames from 'classnames';
import EpicComponent from 'epic-component';
import Immutable from 'immutable';

import {ShowVar} from './utils';
import {Array1D} from './array1d';
import {Array2D} from './array2d';
import {SortView} from './sort';
import MemoryViewDirective from './memory';

export default function (bundle, deps) {

  bundle.use('stepperViewControlsChanged', 'getStepperDisplay');

  function DirectivesPaneSelector (state, props) {
    const getMessage = state.get('getMessage');
    const stepperState = deps.getStepperDisplay(state);
    return {state: stepperState, getMessage};
  }

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
      const style = {width: '100%'};
      const width = directive.byName['width'];
      if (width && width[0] === 'number') {
        style.width = `${width[1]*100}%`;
      }
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
        <div key={key} className='directive-view' style={style}>
          <Panel className="directive" header={header}>
            {self.props.children}
          </Panel>
        </div>
      );
    };

  });

  bundle.defineView('DirectivesPane', DirectivesPaneSelector, EpicComponent(self => {

    const directiveViewDict = {
      showVar: {View: ShowVar, selector: obj => obj},
      showArray: {View: Array1D, selector: obj => obj},
      showArray2D: {View: Array2D, selector: obj => obj},
      showSort: {View: SortView, selector: obj => obj},
      showMemory: MemoryViewDirective,
    };

    const onControlsChange = function (directive, update) {
      const {key} = directive;
      self.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
    };

    const toggleView = function (key) {
      const controls = self.props.state.controls.get(key, Immutable.Map());
      const update = {hide: !controls.get('hide', false)};
      self.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
    };

    const renderDirectiveButton = function (directive) {
      const controls = self.props.state.controls.get(directive.key, Immutable.Map());
      const hide = controls.get('hide', false);
      return (
        <NavItem key={directive.key} eventKey={directive.key} active={!hide}>
          {directive.key}
        </NavItem>
      );
    };

    self.render = function () {
      const {state, scale, getMessage} = self.props;
      if (!state || !state.analysis) {
        return false;
      }
      const {core, oldCore, analysis, controls, directives} = state;
      const {ordered, framesMap} = directives;
      const focusDepth = controls.getIn(['stack', 'focusDepth'], 0);
      const context = {core, oldCore};

      const renderDirective = function (directive) {
        const {key, kind} = directive;
        const directiveControls = controls.get(key, Immutable.Map());
        const hide = directiveControls.get('hide', false);
        if (hide) {
          return false;
        }
        if (directive[0] === 'error') {
          return <p>{'Error: '}{JSON.stringify(directive[1])}</p>;
        }
        if (!directiveViewDict[kind]) {
          return <p>{'Error: undefined view kind '}{kind}</p>;
        }
        const {View, selector} = directiveViewDict[kind];
        const props = selector({scale, directive, context, controls: directiveControls, frames: framesMap[key]});
        return (
          <View key={directive.key} Frame={DirectiveFrame}
            getMessage={getMessage} onChange={onControlsChange}
            {...props} />);
      };

      return (
        <div className='directive-group'>
          <div className='directive-bar'>
            <Navbar>
              <Nav onSelect={toggleView} bsStyle='pills'>
                {ordered.map(renderDirectiveButton)}
              </Nav>
            </Navbar>
          </div>
          <div className='directive-pane clearfix'>
            {ordered.map(renderDirective)}
          </div>
        </div>
      );
    };

  }));

};
