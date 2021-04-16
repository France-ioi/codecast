import React from 'react';
import {StepperControls} from "../stepper/views/StepperControls";
import {connect} from "react-redux";
import {AppStore, CodecastOptions} from "../store";
import {Col, Container, Row} from 'react-bootstrap';
import {BufferEditor} from "../buffers/BufferEditor";
import {getPlayerState} from "../player/selectors";
import {Dialog, Icon, Intent, ProgressBar} from "@blueprintjs/core";
import {ActionTypes as StepperActionTypes} from "../stepper/actionTypes";
import {ActionTypes} from "./actionTypes";
import {MenuTask} from "./MenuTask";
import {RecorderControlsTask} from "./RecorderControlsTask";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {PlayerError} from "../player";
import {PlayerControlsTask} from "./PlayerControlsTask";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {MultiVisualization} from "./MultiVisualization";
import {PythonStackView} from "../stepper/python/analysis/components/PythonStackView";
import {StackView} from "../stepper/views/c/StackView";
import {StepperStatus} from "../stepper";

interface TaskAppStateToProps {
    readOnly: boolean,
    sourceMode: string,
    sourceRowHeight: number,
    error: string,
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
    recordingEnabled: boolean,
    playerEnabled: boolean,
    isPlayerReady: boolean,
    playerProgress: number,
    playerError: PlayerError,
    getMessage: Function,
    options: CodecastOptions,
    taskSuccess: boolean,
    taskSuccessMessage: string,
    advisedVisualization: string,
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
    const recordingEnabled = state.task.recordingEnabled;
    const playerEnabled = !!state.options.baseDataUrl;
    const taskSuccess = state.task.success;
    const taskSuccessMessage = state.task.successMessage;

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
    const isPlayerReady = player.isReady;
    const playerProgress = player.progress;
    const playerError = player.error;
    const windowHeight = state.windowHeight;
    const options = state.options;

    const advisedVisualization = !state.stepper || state.stepper.status === StepperStatus.Clear ? 'instructions' : 'variables';

    return {
        readOnly, error, getMessage, geometry, panes, sourceRowHeight,
        sourceMode, showStack, arduinoEnabled, showViews, showIO, windowHeight,
        currentStepperState, fullScreenActive, diagnostics, recordingEnabled,
        preventInput, isPlayerReady, playerProgress, playerError, playerEnabled,
        options, taskSuccess, taskSuccessMessage, advisedVisualization,
    };
}

interface TaskAppDispatchToProps {
    dispatch: Function
}

interface TaskAppProps extends TaskAppStateToProps, TaskAppDispatchToProps {

}

interface TaskAppState {
    menuOpen: boolean,
}

class _TaskApp extends React.PureComponent<TaskAppProps, TaskAppState> {
    state = {menuOpen: false};

    render() {
        const {
            readOnly, sourceMode, error,
            preventInput, fullScreenActive,
            diagnostics, recordingEnabled,
            playerProgress, isPlayerReady,
            playerEnabled, getMessage,
            taskSuccess, taskSuccessMessage, advisedVisualization,
        } = this.props;

        const hasError = !!(error || diagnostics);

        return (
            <Container fluid className={`task ${fullScreenActive ? 'full-screen' : ''}`}>
                <div className="task-section">
                    <div className="task-header">
                        <span className="task-header__quick">QUICK</span>
                        <span className="task-header__algo">ALGO</span>
                    </div>

                    <Row className="task-body" noGutters>
                        <Col md={3} className="task-menu-left">
                            <MultiVisualization className="visualization-container" advisedVisualization={advisedVisualization}>
                                <div className="task-mission" data-title={getMessage('TASK_DESCRIPTION')} data-id="instructions" data-icon="align-left">
                                    <h1>Votre mission</h1>

                                    <p>Programmez le robot ci-dessous pour qu&#39;il atteigne l&#39;étoile, en sautant de plateforme en plateforme.</p>
                                </div>
                                <div data-title={getMessage('TASK_VARIABLES')} data-id="variables" data-icon="code">
                                    {(this.props.currentStepperState && this.props.currentStepperState.platform === 'python')
                                        ? <PythonStackView
                                            height={this.props.sourceRowHeight}
                                            analysis={this.props.currentStepperState.analysis}
                                        />
                                        : <StackView
                                            height={this.props.sourceRowHeight}
                                        />
                                    }
                                </div>
                            </MultiVisualization>

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
                        </Col>
                    </Row>

                    {recordingEnabled &&
                        <div className="task-footer">
                          <RecorderControlsTask/>
                        </div>
                    }

                    {playerEnabled && isPlayerReady &&
                        <div className="task-footer">
                          <PlayerControlsTask/>
                          <SubtitlesBand/>
                        </div>
                    }
                </div>
                <MenuTask/>

                <Dialog isOpen={playerEnabled && !isPlayerReady} title={getMessage('PLAYER_PREPARING')} isCloseButtonShown={false}>
                    <div style={{margin: '20px 20px 0 20px'}}>
                        <ProgressBar value={playerProgress} intent={Intent.SUCCESS}/>
                    </div>
                </Dialog>

                <Dialog isOpen={taskSuccess} className="simple-dialog" onClose={this.closeTaskSuccess}>
                    <p className="simple-dialog-success">{taskSuccessMessage}</p>

                    <div className="simple-dialog-buttons">
                        <button className="simple-dialog-button" onClick={this.closeTaskSuccess}>
                            <Icon icon="small-tick" iconSize={24}/>
                            <span>Ok</span>
                        </button>
                    </div>
                </Dialog>
            </Container>
        );
    };

    componentDidMount() {
        this.props.dispatch({type: ActionTypes.TaskLoad});

        if (this.props.options.baseDataUrl) {
            let audioUrl = `${this.props.options.baseDataUrl}.mp3`;
            this.props.dispatch({
                type: PlayerActionTypes.PlayerPrepare,
                payload: {
                    baseDataUrl: this.props.options.baseDataUrl,
                    audioUrl: audioUrl,
                    eventsUrl: `${this.props.options.baseDataUrl}.json`,
                }
            });
        }
    }

    _onClearDiagnostics = () => {
        this.props.dispatch({type: StepperActionTypes.CompileClearDiagnostics});
    };

    closeTaskSuccess = () => {
        this.props.dispatch({type: ActionTypes.TaskSuccessClear});
    };
}

export const TaskApp = connect(mapStateToProps)(_TaskApp);
