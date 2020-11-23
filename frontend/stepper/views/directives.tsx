import React from 'react';
import {Alignment, Navbar, NavbarGroup} from '@blueprintjs/core';
import Immutable from 'immutable';
import {DirectiveButton} from "./DirectiveButton";
import {DirectivePanel} from "./DirectivePanel";

interface DirectivesPaneProps {
    dispatch: Function,
    state: any,
    scale: any,
    getMessage: any
}

export default function (bundle, deps) {
    bundle.use('stepperViewControlsChanged', 'getCurrentStepperState');

    function DirectivesPaneSelector(state) {
        const getMessage = state.get('getMessage');
        const stepperState = deps.getCurrentStepperState(state);
        return {state: stepperState, getMessage};
    }

    bundle.defineView('DirectivesPane', DirectivesPaneSelector, class DirectivesPane extends React.PureComponent<DirectivesPaneProps> {
        onControlsChange = (directive, update) => {
            const {key} = directive;
            this.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
        };

        toggleView = (key) => {
            const controls = this.props.state.controls.get(key, Immutable.Map());
            const update = {hide: !controls.get('hide', false)};
            this.props.dispatch({type: deps.stepperViewControlsChanged, key, update});
        };

        render() {
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
