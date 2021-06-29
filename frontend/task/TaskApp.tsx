import React, {useEffect} from 'react';
import {useDispatch} from "react-redux";
import {Container} from 'react-bootstrap';
import {Dialog, Icon, Intent, ProgressBar} from "@blueprintjs/core";
import {MenuTask} from "./MenuTask";
import {RecorderControlsTask} from "./RecorderControlsTask";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {PlayerControlsTask} from "./PlayerControlsTask";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {LayoutLoader} from "./layout/LayoutLoader";
import {taskSuccessClear} from "./task_slice";
import {taskLoad} from "./index";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import {useAppSelector} from "../hooks";
import {CodecastOptionsMode} from "../store";
import {EditorInterface} from "../editor/EditorInterface";
import {SubtitlesEditorPane} from "../subtitles/views/SubtitlesEditorPane";
import {ActionTypes} from "../subtitles/actionTypes";
import {SubtitlesEditor} from "../subtitles/SubtitlesEditor";
import {LoginScreen} from "../common/LoginScreen";

export function TaskApp() {
    const getMessage = useAppSelector(state => state.getMessage);
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);
    const recordingEnabled = useAppSelector(state => state.task.recordingEnabled);
    const playerEnabled = !!useAppSelector(state => state.options.baseDataUrl);
    const taskSuccess = useAppSelector(state => state.task.success);
    const taskSuccessMessage = useAppSelector(state => state.task.successMessage);
    const player = useAppSelector(state => state.player);
    const isPlayerReady = player.isReady;
    const options = useAppSelector(state => state.options);
    const layoutType = useAppSelector(state => state.layout.type);
    const editor = useAppSelector(state => state.editor);
    const displayEditor = editor && editor.playerReady;
    const user = useAppSelector(state => state.user);
    const audioLoaded = editor.audioLoaded;

    let progress = null;
    let progressMessage = null;
    if (options.baseDataUrl && CodecastOptionsMode.Edit === options.mode && !audioLoaded) {
        progress = editor.audioLoadProgress;
        progressMessage = getMessage('PLAYER_LOADING_AUDIO');
    } else if (playerEnabled && !isPlayerReady) {
        progress = player.progress;
        progressMessage = getMessage('PLAYER_PREPARING');
    }

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(taskLoad());

        if (options.baseDataUrl) {
            let audioUrl = `${options.baseDataUrl}.mp3`;

            if (CodecastOptionsMode.Edit === options.mode) {
                dispatch({
                    type: EditorActionTypes.EditorPrepare,
                    payload: {
                        baseDataUrl: options.baseDataUrl,
                    },
                });
                dispatch({type: ActionTypes.SubtitlesEditorEnter});
            } else {
                dispatch({
                    type: PlayerActionTypes.PlayerPrepare,
                    payload: {
                        baseDataUrl: options.baseDataUrl,
                        audioUrl: audioUrl,
                        eventsUrl: `${options.baseDataUrl}.json`,
                    }
                });
            }
        }
    }, []);

    const closeTaskSuccess = () => {
        dispatch(taskSuccessClear());
    };

    if (!user && options.baseDataUrl && CodecastOptionsMode.Edit === options.mode) {
        return (
            <div id='editor-app'>
                <div className="cc-login">
                    <h1 style={{margin: '20px 0'}}>{"Codecast Editor"}</h1>

                    <LoginScreen/>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className={`task ${fullScreenActive ? 'full-screen' : ''} layout-${layoutType}`}>
            <div className="task-section">
                <div className="task-header">
                    <span className="task-header__quick">QUICK</span>
                    <span className="task-header__algo">ALGO</span>
                </div>

                <div className="task-body">
                    <LayoutLoader width={null} height={null}/>
                    {displayEditor &&
                        <div key="subtitles" className="subtitles-pane-container">
                            <SubtitlesEditor
                              light={true}
                            />
                            <SubtitlesEditorPane/>
                        </div>
                    }
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

                {displayEditor &&
                    <div className="task-footer">
                      <EditorInterface/>
                    </div>
                }
            </div>
            <MenuTask/>

            <Dialog isOpen={!!progressMessage} title={progressMessage} isCloseButtonShown={false}>
                <div style={{margin: '20px 20px 0 20px'}}>
                    <ProgressBar value={progress} intent={Intent.SUCCESS}/>
                </div>
            </Dialog>

            <Dialog isOpen={taskSuccess} className="simple-dialog" onClose={closeTaskSuccess}>
                <p className="simple-dialog-success">{taskSuccessMessage}</p>

                <div className="simple-dialog-buttons">
                    <button className="simple-dialog-button" onClick={closeTaskSuccess}>
                        <Icon icon="small-tick" iconSize={24}/>
                        <span>Ok</span>
                    </button>
                </div>
            </Dialog>
        </Container>
    );
}
