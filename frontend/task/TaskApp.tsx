import React, {useEffect, useState} from 'react';
import {useDispatch} from "react-redux";
import {Container} from 'react-bootstrap';
import {Dialog, Intent, ProgressBar} from "@blueprintjs/core";
import {MenuTask} from "./MenuTask";
import {RecorderControlsTask} from "./RecorderControlsTask";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {PlayerControlsTask} from "./PlayerControlsTask";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {ActionTypes as LayoutActionTypes} from "../task/layout/actionTypes";
import {LayoutLoader} from "./layout/LayoutLoader";
import {taskLoad} from "./index";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import {useAppSelector} from "../hooks";
import {CodecastOptionsMode} from "../store";
import {EditorInterface} from "../editor/EditorInterface";
import {SubtitlesEditorPane} from "../subtitles/views/SubtitlesEditorPane";
import {ActionTypes} from "../subtitles/actionTypes";
import {SubtitlesEditor} from "../subtitles/SubtitlesEditor";
import {LoginScreen} from "../common/LoginScreen";
import {ZOOM_LEVEL_LOW} from "./layout/layout";
import {getMessage} from "../lang";
import {TaskLevelTabs} from "./TaskLevelTabs";
import {TaskSuccessDialog} from "./dialog/TaskSuccessDialog";
import {TaskLevelName} from "./task_slice";

export function TaskApp() {
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);
    const recordingEnabled = useAppSelector(state => state.task.recordingEnabled);
    const playerEnabled = !!useAppSelector(state => state.options.audioUrl);
    const player = useAppSelector(state => state.player);
    const isPlayerReady = player.isReady;
    const options = useAppSelector(state => state.options);
    const layoutType = useAppSelector(state => state.layout.type);
    const editor = useAppSelector(state => state.editor);
    const displayEditor = editor && editor.playerReady;
    const user = useAppSelector(state => state.user);
    const audioLoaded = editor.audioLoaded;
    const [initialUserCheck, setInitialUserCheck] = useState(false);
    const taskLevels = useAppSelector(state => state.task.levels);

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
        // Wait that the html is loaded before we create the context because some of them use jQuery to select elements
        setTimeout(() => {
            const taskLoadParameters: {level?: TaskLevelName} = {};
            if (options.level) {
                taskLoadParameters.level = options.level;
            }
            dispatch(taskLoad(taskLoadParameters));

            if (options.audioUrl) {
                if (CodecastOptionsMode.Edit === options.mode) {
                    dispatch({
                        type: EditorActionTypes.EditorPrepare,
                        payload: {
                            baseDataUrl: options.baseDataUrl,
                        },
                    });
                    dispatch({type: ActionTypes.SubtitlesEditorEnter});
                } else {
                    dispatch({type: LayoutActionTypes.LayoutZoomLevelChanged, payload: {zoomLevel: ZOOM_LEVEL_LOW}});

                dispatch({
                        type: PlayerActionTypes.PlayerPrepare,
                        payload: {
                            baseDataUrl: options.baseDataUrl,
                            audioUrl: options.audioUrl,
                            eventsUrl: `${options.baseDataUrl}.json`,
                            data: options.data
                        }
                    });
                }
            }
        });
    }, []);

    if (options.baseDataUrl && CodecastOptionsMode.Edit === options.mode) {
        if (user) {
            if (!initialUserCheck) {
                setInitialUserCheck(true);
            }
        } else if (!initialUserCheck) {
            return (
                <div id='editor-app'>
                    <div className="cc-login">
                        <h1 style={{margin: '20px 0'}}>{"Codecast Editor"}</h1>

                        <LoginScreen/>
                    </div>
                </div>
            );
        }
    }

    return (
        <Container fluid className={`task ${fullScreenActive ? 'full-screen' : ''} layout-${layoutType}`}>
            <div className="task-section">
                <div className="task-header">
                    <span className="task-header__quick">QUICK</span>
                    <span className="task-header__algo">ALGO</span>
                </div>

                {taskLevels && 1 < Object.keys(taskLevels).length && <TaskLevelTabs/>}

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

            <Dialog isOpen={!!progressMessage} title={progressMessage ? progressMessage : 'Info'} isCloseButtonShown={false}>
                <div style={{margin: '20px 20px 0 20px'}}>
                    <ProgressBar value={progress} intent={Intent.SUCCESS}/>
                </div>
            </Dialog>

            <TaskSuccessDialog/>
        </Container>
    );
}
