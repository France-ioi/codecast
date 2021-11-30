import React from "react";
import classnames from 'classnames';
import {Alert, Button, ButtonGroup, Icon, Intent} from "@blueprintjs/core";
import {FunctionCall, renderValue, VarDecl, viewStackFrame} from "./utils";
import {ActionTypes} from "../../actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../../../store";
import {getCurrentStepperState} from "../../selectors";
import {getMessage} from "../../../lang";

interface StackViewStateToProps {
    context?: any,
    analysis?: any,
    firstVisible?: number,
    firstExpanded?: number,
    maxExpanded?: number
}

function mapStateToProps(state: AppStore): StackViewStateToProps {
    const stepperState = getCurrentStepperState(state);
    if (!stepperState) {
        return {};
    }

    const {programState, lastProgramState, analysis, controls} = stepperState;
    const stackControls = controls.stack;
    const focusDepth = stackControls ? stackControls.focusDepth : 0;
    const firstVisible = Math.max(0, focusDepth - 5);

    return {
        context: {programState, lastProgramState},
        analysis,
        firstVisible,
        firstExpanded: focusDepth - firstVisible,
        maxExpanded: 1
    };
}

interface StackViewDispatchToProps {
    dispatch: Function
}

interface StackViewProps extends StackViewStateToProps, StackViewDispatchToProps {
    height: any,
    maxVisible: any,
    showStackControls?: boolean,
}

class _StackView extends React.PureComponent<StackViewProps> {
    static defaultProps = {
        height: '100%',
        firstVisible: 0,
        maxVisible: 10,
        firstExpanded: 0,
        maxExpanded: 1
    };

    onExit() {
        this.props.dispatch({type: ActionTypes.StepperExit});
    };

    onStackUp() {
        this.props.dispatch({type: ActionTypes.StepperStackUp});
    };

    onStackDown() {
        this.props.dispatch({type: ActionTypes.StepperStackDown});
    };

    render() {
        const {context, height} = this.props;
        if (!context) {
            return (
                <div className="stack-view" style={{maxHeight: height}}>
                    <p>{getMessage('PROGRAM_STOPPED')}</p>
                </div>
            );
        }

        const {programState} = context;
        if (programState.error) {
            return (
                <div className="stack-view" style={{maxHeight: height}}>
                    <Alert intent={Intent.DANGER} onClose={this.onExit}>
                        <h4>{getMessage('ERROR')}</h4>
                        <p>{programState.error.toString()}</p>
                    </Alert>
                </div>
            );
        }

        const {analysis, firstVisible, firstExpanded, maxVisible, maxExpanded} = this.props;
        let {functionCallStack} = analysis;
        /* Hide function calls that have no position in user code. */
        functionCallStack = functionCallStack.filter(function(stackFrame) {
            return stackFrame.get('func').body[1].range;
        });

        /* Display the functionCallStack in reverse order (top of the stack last). */
        functionCallStack = functionCallStack.reverse();
        const beyondVisible = Math.min(functionCallStack.size, firstVisible + maxVisible);
        const tailCount = functionCallStack.size - beyondVisible;
        const views = functionCallStack.slice(firstVisible, beyondVisible).map(function(stackFrame, depth) {
            const focus = depth >= firstExpanded && depth < firstExpanded + maxExpanded;
            const view = viewStackFrame(context, stackFrame, {locals: focus});
            view.focus = focus;

            return view;
        });

        const {callReturn} = this.props.analysis;

        return (
            <div className="stack-view" style={{maxHeight: height}}>
                {this.props.showStackControls &&
                    <div className="stack-controls">
                      <ButtonGroup>
                        <Button minimal small onClick={this.onStackUp} title="navigate up the stack" icon='arrow-up'/>
                        <Button minimal small onClick={this.onStackDown} title="navigate down the stack" icon='arrow-down'/>
                      </ButtonGroup>
                    </div>
                }
                {callReturn && <CallReturn view={callReturn}/>}
                {firstVisible > 0 &&
                <div key='tail' className="scope-ellipsis">
                    {'… +'}{firstVisible}
                </div>
                }
                {views.map(view => <FunctionStackFrame key={view.key} view={view}/>)}
                {tailCount > 0 &&
                <div key='tail' className="scope-ellipsis">
                    {'… +'}{tailCount}
                </div>}
            </div>
        );
    };
}

export const StackView = connect(mapStateToProps)(_StackView);

function FunctionStackFrame({view}) {
    const {func, args, locals} = view;
    return (
        <div className={classnames(['stack-frame', view.focus && 'stack-frame-focused'])}>
            <StackFrameHeader func={func} args={args}/>
            {locals && <StackFrameLocals locals={locals}/>}
        </div>
    );
}

function StackFrameHeader({func, args}) {
    return (
        <div className={classnames(["scope-function-title"])}>
            <FunctionCall func={func} args={args}/>
        </div>
    );
}

function StackFrameLocals({locals}) {
    return (
        <div className="scope-function-blocks">
            <ul>
                {locals.map(decl =>
                    <li key={decl.name}><VarDecl {...decl}/></li>
                )}
            </ul>
        </div>
    );
}

function CallReturn({view}) {
    const {func, args, result} = view;

    return (
        <div className="scope-function-return">
            <FunctionCall func={func} args={args}/>
            {' '}
            <Icon icon='arrow-right'/>
            <span className="scope-function-retval">
            {renderValue(result)}
          </span>
        </div>
    );
}
