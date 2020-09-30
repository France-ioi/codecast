import React from 'react';
import {Alignment, Button, Navbar, NavbarGroup} from '@blueprintjs/core';
import Immutable from 'immutable';

import {ShowVar as C_ShowVar} from './c/utils';
import {Array1D as C_Array1D} from './c/array1d';
import {Array2D as C_Array2D} from './c/array2d';
import {SortView as C_SortView} from './c/sort';
import MemoryViewDirective from './c/memory';

import {Array1D as pythonArray1D} from './python/array1d';
import {Array2D as pythonArray2D} from './python/array2d';
import DirectiveFrame from './DirectiveFrame';

const C_directiveViewDict = {
  showVar: {View: C_ShowVar, selector: obj => obj},
  showArray: {View: C_Array1D, selector: obj => obj},
  showArray2D: {View: C_Array2D, selector: obj => obj},
  showSort: {View: C_SortView, selector: obj => obj},
  showMemory: MemoryViewDirective,
};
const pythonDirectiveViewDict = {
  showArray: {View: pythonArray1D, selector: obj => obj},
  showArray2D: {View: pythonArray2D, selector: obj => obj}
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

      const {analysis, programState, lastProgramState, controls, directives, platform} = state;
      const {ordered, functionCallStackMap} = directives;
      const context = {analysis, programState, lastProgramState};
      const buttons = [], panels = [];
      for (let directive of ordered) {
        const {key} = directive;
        const dirControls = controls.get(key, Immutable.Map());

        buttons.push(
            <DirectiveButton
                key={key}
                directive={directive}
                controls={dirControls}
                onSelect={this.toggleView}
            />
        );

        let functionCallStack = null;
        if (platform === 'unix' || platform === 'arduino') {
          functionCallStack = functionCallStackMap[key];
        }

        panels.push(
            <DirectivePanel
                key={key}
                directive={directive}
                controls={dirControls}
                scale={scale}
                context={context}
                functionCallStack={functionCallStack}
                platform={platform}
                getMessage={getMessage}
                onChange={this.onControlsChange}
            />
        );
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

function DirectivePanel ({scale, directive, controls, context, functionCallStack, platform, getMessage, onChange}) {
  const {kind} = directive;
  const hide = controls.get('hide', false);
  if (hide) {
    return false;
  }
  if (directive[0] === 'error') {
    return <p>{'Error: '}{JSON.stringify(directive[1])}</p>;
  }

  let directiveViewDict = C_directiveViewDict;
  if (platform === 'python') {
    directiveViewDict = pythonDirectiveViewDict;
  }

  if (!directiveViewDict[kind]) {
    return <p>{'Error: undefined view kind '}{kind}</p>;
  }

  const {View, selector} = directiveViewDict[kind];
  const props = selector({scale, directive, context, controls, functionCallStack});

  return (
    <View
        DirectiveFrame={DirectiveFrame}
        getMessage={getMessage}
        onChange={onChange}
        {...props}
    />
  );
}
