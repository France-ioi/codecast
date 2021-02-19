import React from "react";
import {DirectiveButton} from "./DirectiveButton";
import {DirectivePanel} from "./DirectivePanel";
import {Alignment, Navbar, NavbarGroup} from "@blueprintjs/core";
import {ActionTypes} from "../actionTypes";
import {connect} from "react-redux";
import {getCurrentStepperState} from "../selectors";
import {AppStore} from "../../store";

interface DirectivesPaneStateToProps {
    stepperState: any,
    getMessage: Function
}

function mapStateToProps(state: AppStore): DirectivesPaneStateToProps {
    const getMessage = state.getMessage;
    const stepperState = getCurrentStepperState(state);

    return {
        stepperState,
        getMessage
    };
}

interface DirectivesPaneDispatchToProps {
    dispatch: Function
}

interface DirectivesPaneProps extends DirectivesPaneStateToProps, DirectivesPaneDispatchToProps {
    scale: any
}

class _DirectivesPane extends React.PureComponent<DirectivesPaneProps> {
    onControlsChange = (directive, update) => {
        const {key} = directive;
        this.props.dispatch({type: ActionTypes.StepperViewControlsChanged, key, update});
    };

    toggleView = (key) => {
        const controls = (this.props.stepperState.controls.hasOwnProperty(key)) ? this.props.stepperState.controls[key] : {};
        const update = {
            hide: !controls.hide
        };

        this.props.dispatch({type: ActionTypes.StepperViewControlsChanged, key, update});
    };

    render() {
        const {stepperState, scale, getMessage} = this.props;
        if (!stepperState || !stepperState.analysis) {
            return false;
        }

        const {analysis, programState, lastProgramState, controls, directives, platform} = stepperState;
        const {ordered, functionCallStackMap} = directives;
        const context = {analysis, programState, lastProgramState};
        const buttons = [], panels = [];
        for (let directive of ordered) {
            const {key} = directive;
            const dirControls = (controls.hasOwnProperty(key)) ? controls[key] : {};

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
}

export const DirectivesPane = connect(mapStateToProps)(_DirectivesPane);
