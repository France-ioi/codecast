import React from 'react';
import {connect} from "react-redux";
import {AppStore, CodecastOptions} from "../store";
import {Container} from 'react-bootstrap';
import {getPlayerState} from "../player/selectors";
import {Dialog, Icon, Intent, ProgressBar} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {MenuTask} from "./MenuTask";
import {RecorderControlsTask} from "./RecorderControlsTask";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {PlayerControlsTask} from "./PlayerControlsTask";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {LayoutLoader} from "./layout/LayoutLoader";

interface TaskAppStateToProps {
    fullScreenActive: boolean,
    recordingEnabled: boolean,
    playerEnabled: boolean,
    isPlayerReady: boolean,
    playerProgress: number,
    getMessage: Function,
    options: CodecastOptions,
    taskSuccess: boolean,
    taskSuccessMessage: string,
}

function mapStateToProps(state: AppStore): TaskAppStateToProps {
    const getMessage = state.getMessage;
    const fullScreenActive = state.fullscreen.active;
    const recordingEnabled = state.task.recordingEnabled;
    const playerEnabled = !!state.options.baseDataUrl;
    const taskSuccess = state.task.success;
    const taskSuccessMessage = state.task.successMessage;
    const player = getPlayerState(state);
    const isPlayerReady = player.isReady;
    const playerProgress = player.progress;
    const options = state.options;

    return {
        fullScreenActive, recordingEnabled, playerProgress, isPlayerReady,
        playerEnabled, getMessage, taskSuccess, taskSuccessMessage, options,
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
            fullScreenActive, recordingEnabled, playerProgress, isPlayerReady,
            playerEnabled, getMessage, taskSuccess, taskSuccessMessage,
        } = this.props;

        return (
            <Container fluid className={`task ${fullScreenActive ? 'full-screen' : ''}`}>
                <div className="task-section">
                    <div className="task-header">
                        <span className="task-header__quick">QUICK</span>
                        <span className="task-header__algo">ALGO</span>
                    </div>

                    <div className="task-body">
                        <LayoutLoader width={null} height={null}/>
                    </div>

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

    closeTaskSuccess = () => {
        this.props.dispatch({type: ActionTypes.TaskSuccessClear});
    };
}

export const TaskApp = connect(mapStateToProps)(_TaskApp);
