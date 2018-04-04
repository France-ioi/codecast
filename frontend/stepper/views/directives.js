
import React from 'react';
import {Panel, Button, Navbar, Nav, NavItem} from 'react-bootstrap';
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

  bundle.use('stepperViewControlsChanged', 'getStepperDisplay');

  function DirectivesPaneSelector (state, props) {
    const getMessage = state.get('getMessage');
    const stepperState = deps.getStepperDisplay(state);
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
      const {core, oldCore, analysis, controls, directives} = state;
      const {ordered, framesMap} = directives;
      const focusDepth = controls.getIn(['stack', 'focusDepth'], 0);
      const context = {core, oldCore};
      const buttons = [], panels = [];
      for (let directive of ordered) {
        const {key} = directive;
        const dirControls = controls.get(key, Immutable.Map());
        buttons.push(<DirectiveButton key={key} directive={directive} controls={dirControls} />);
        panels.push(<DirectivePanel key={key} directive={directive} controls={dirControls}
          scale={scale} context={context} frames={framesMap[key]} getMessage={getMessage} onChange={this.onControlsChange} />);
      }
      return (
        <div className='directive-group'>
          <div className='directive-bar'>
            <Navbar>
              <Nav onSelect={this.toggleView} bsStyle='pills'>
                {buttons}
              </Nav>
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

function DirectiveButton ({directive, controls}) {
  const hide = controls.get('hide', false);
  return (
    <NavItem eventKey={directive.key} active={!hide}>
      {directive.key}
    </NavItem>
  );
}

function DirectivePanel ({scale, directive, controls, context, frames, getMessage, onChange}) {
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
  const props = selector({scale, directive, context, controls, frames});
  return (
    <View Frame={DirectiveFrame} getMessage={getMessage} onChange={onChange}
      {...props} />);
};

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
                  <Button onClick={this.onToggleFullView} bsSize="xs">
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
