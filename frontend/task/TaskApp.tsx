import React from 'react';
import {StepperControls} from "../stepper/views/StepperControls";
import {MenuTask} from "../common/MenuTask";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {Container, Row, Col} from 'react-bootstrap';
import {BufferEditor} from "../buffers/BufferEditor";
import {getPlayerState} from "../player/selectors";
import {ActionTypes} from "./actionTypes";
import {Icon} from "@blueprintjs/core";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";

interface TaskAppStateToProps {
    readOnly: boolean,
    sourceMode: string,
    sourceRowHeight: number,
    error: string,
    getMessage: Function,
    geometry: any,
    panes: any,
    showStack: boolean,
    arduinoEnabled: boolean,
    showViews: boolean,
    showIO: boolean,
    windowHeight: any,
    currentStepperState: any,
    preventInput: any,
    fullScreenActive: boolean,
    diagnostics: any,
}

function mapStateToProps(state: AppStore): TaskAppStateToProps {
    const getMessage = state.getMessage;
    const geometry = state.mainViewGeometry;
    const panes = state.panes;
    const fullScreenActive = state.fullscreen.active;
    const currentStepperState = state.stepper.currentStepperState;
    const readOnly = false;
    const {showIO, showViews, showStack, platform} = state.options;
    const arduinoEnabled = platform === 'arduino';
    const diagnostics = state.compile.diagnosticsHtml;
    const error = currentStepperState && currentStepperState.error;

    /* TODO: make number of visible rows in source editor configurable. */
    const sourceRowHeight = Math.ceil(16 * 25); // 12*25 for /next

    let mode;
    switch (platform) {
        case 'arduino':
            mode = 'arduino';

            break;
        case 'python':
            mode = 'python';

            break;
        default:
            mode = 'c_cpp';

            break;
    }

    const sourceMode = mode;

    const player = getPlayerState(state);
    const preventInput = player.isPlaying;
    const windowHeight = state.windowHeight;

    return {
        readOnly, error, getMessage, geometry, panes, preventInput, sourceRowHeight,
        sourceMode, showStack, arduinoEnabled, showViews, showIO, windowHeight,
        currentStepperState, fullScreenActive, diagnostics,
    };
}

interface TaskAppDispatchToProps {
    dispatch: Function
}

interface TaskAppProps extends TaskAppStateToProps, TaskAppDispatchToProps {

}

class _TaskApp extends React.PureComponent<TaskAppProps> {
    render() {
        const {
            readOnly, sourceMode, error,
            preventInput, fullScreenActive,
            diagnostics,
        } = this.props;

        const hasError = !!(error || diagnostics);

        return (
            <Container fluid className={`task ${fullScreenActive ? 'full-screen' : ''}`}>
                <div className="task-header">
                    <span className="task-header__quick">QUICK</span>
                    <span className="task-header__algo">ALGO</span>
                </div>

                <Row className="task-body" noGutters>
                    <Col md={3} className="task-menu-left">
                        <div className="task-mission">
                            <h1>Votre mission</h1>

                            <p>Programmez le robot ci-dessous pour qu&#39;il atteigne l&#39;étoile, en sautant de plateforme en plateforme.</p>
                        </div>

                        <hr/>

                        <div className="task-visualisation">
                            <div id="grid"/>
                        </div>

                        <div className="player-controls">
                            <StepperControls enabled={true} newControls={true}/>
                            {hasError && <div className="error-message" onClick={this._onClearDiagnostics}>
                                <button type="button" className="close-button" onClick={this._onClearDiagnostics}>
                                    <Icon icon="cross"/>
                                </button>
                                <div className="message-wrapper">
                                    <Icon icon="notifications" className="bell-icon"/>
                                    <div className="message">
                                        {diagnostics && <div dangerouslySetInnerHTML={diagnostics}/>}
                                        {error && <div>{error}</div>}
                                    </div>
                                </div>
                            </div>}
                        </div>
                    </Col>
                    <Col md={fullScreenActive ? 12 : 9}>
                        <BufferEditor
                            buffer='source'
                            readOnly={readOnly}
                            shield={preventInput}
                            mode={sourceMode}
                            theme={'textmate'}
                            width='100%'
                            height='100%'
                        />

                        <div className="menu-app">
                            <MenuTask/>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    };

    _onClearDiagnostics = () => {
        this.props.dispatch({type: StepperActionTypes.CompileClearDiagnostics});
    };
}

export const TaskApp = connect(mapStateToProps)(_TaskApp);
