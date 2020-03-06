
import React from 'react';
import {Panel} from 'react-bootstrap';
import {Alignment, Button, Navbar, NavbarGroup} from '@blueprintjs/core';
import classnames from 'classnames';
import Immutable from 'immutable';

import {ShowVar} from './utils';
import {Array1D} from './array1d';
import {Array2D} from './array2d';
import {SortView} from './sort';
import MemoryViewDirective from './memory';

const directiveViewDict = {
  showVar: {View: ShowVar, selector: obj => obj},
  showArray: {View: Array1D, selector: obj => obj},
  showArray2D: {View: Array2D, selector: obj => obj},
  showSort: {View: SortView, selector: obj => obj},
  showMemory: MemoryViewDirective,
};

export default function (bundle, deps) {

  bundle.use('stepperViewControlsChanged', 'getCurrentStepperState');

  function DirectivesPaneSelector (state, props) {
    const getMessage = state.get('getMessage');
    const stepperState = deps.getCurrentStepperState(state);
    return {state: stepperState, getMessage};
  }

  bundle.defineView('DirectivesPane', DirectivesPaneSelector, class DirectivesPane extends React.PureComponent {

    onControlsChange = (directive, update) => {
      const {key} = directive;
      this.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
    };

    toggleView = (key) => {
      const controls = this.props.state.controls.get(key, Immutable.Map());
      const update = {hide: !controls.get('hide', false)};
      this.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
    };

    render () {
      const {state, scale, getMessage} = this.props;
      if (!state || !state.analysis) {
        return false;
      }
      const {programState, lastProgramState, analysis, controls, directives} = state;
      const {ordered, functionCallStackMap} = directives;
      const focusDepth = controls.getIn(['stack', 'focusDepth'], 0);
      const context = {programState, lastProgramState};
      const buttons = [], panels = [];
      for (let directive of ordered) {
        const {key} = directive;
        const dirControls = controls.get(key, Immutable.Map());
        buttons.push(<DirectiveButton key={key} directive={directive} controls={dirControls} onSelect={this.toggleView} />);
        panels.push(<DirectivePanel key={key} directive={directive} controls={dirControls}
          scale={scale} context={context} functionCallStack={functionCallStackMap[key]} getMessage={getMessage} onChange={this.onControlsChange} />);
      }
      return (
        <div className='directive-group'>
          <div className='directive-bar'>
            <Navbar>
              <NavbarGroup align={Alignment.LEFT}>
                {buttons}
              </NavbarGroup>
            </Navbar>
          </div>
          <div className='directive-pane clearfix'>
            {panels}
          </div>
        </div>
      );
    };

  });

};

class DirectiveButton extends React.PureComponent {
  render() {
    const {directive, controls} = this.props;
    const hide = controls.get('hide', false);
    return (
      <Button small minimal active={!hide} text={directive.key} onClick={this.onClick}/>
    );
  }
  onClick = () => {
    this.props.onSelect(this.props.directive.key);
  };
}

function DirectivePanel ({scale, directive, controls, context, functionCallStack, getMessage, onChange}) {
  const {key, kind} = directive;
  const hide = controls.get('hide', false);
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
  const props = selector({scale, directive, context, controls, functionCallStack});
  return (
    <View StackFrame={DirectiveFrame} getMessage={getMessage} onChange={onChange}
      {...props} />);
}

class DirectiveFrame extends React.PureComponent {
  onToggleFullView = () => {
    const {directive, controls, onChange} = this.props;
    const update = {fullView: !controls.get('fullView')};
    onChange(directive, update);
  };
  render () {
    const {directive, controls, title, hasFullView} = this.props;
    const {key} = directive;
    const fullView = controls.get('fullView');
    const style = {width: '100%'};
    const width = directive.byName['width'];
    if (width && width[0] === 'number') {
      style.width = `${width[1]*100}%`;
    }
    return (
      <div key={key} className='directive-view' style={style}>
        <Panel className='directive'>
          <Panel.Heading>
            <div className="directive-header">
              <div className="pull-right">
                {hasFullView &&
                  <Button onClick={this.onToggleFullView} small>
                    {fullView ? 'min' : 'max'}
                  </Button>}
              </div>
              <div className="directive-title">
                {title || key}
              </div>
            </div>
          </Panel.Heading>
          <Panel.Body>
            {this.props.children}
          </Panel.Body>
        </Panel>
      </div>
    );
  }
}
