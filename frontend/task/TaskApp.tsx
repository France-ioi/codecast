import React, {useEffect, useState} from 'react';
import {useDispatch} from "react-redux";
import {Container} from 'react-bootstrap';
import {Dialog, Intent, ProgressBar} from "@blueprintjs/core";
import {MenuTask} from "./MenuTask";
import {RecorderControls} from "./RecorderControls";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {PlayerControls} from "./PlayerControls";
import {ActionTypes as PlayerActionTypes} from "../player/actionTypes";
import {ActionTypes as LayoutActionTypes} from "../task/layout/actionTypes";
import {LayoutLoader} from "./layout/LayoutLoader";
import {ActionTypes as EditorActionTypes} from "../editor/actionTypes";
import {useAppSelector} from "../hooks";
import {CodecastOptionsMode} from "../store";
import {EditorInterface} from "../editor/EditorInterface";
import {SubtitlesEditorPane} from "../subtitles/views/SubtitlesEditorPane";
import {ActionTypes} from "../subtitles/actionTypes";
import {SubtitlesEditor} from "../subtitles/SubtitlesEditor";
import {LoginScreen} from "../common/LoginScreen";
import {selectActiveView, ZOOM_LEVEL_LOW} from "./layout/layout";
import {getMessage} from "../lang";
import {TaskLevelTabs} from "./TaskLevelTabs";
import {TaskSuccessDialog} from "./dialog/TaskSuccessDialog";
import {SubtitlesPane} from "../subtitles/SubtitlesPane";
import {selectDisplayAbout, TaskAbout} from "./TaskAbout";
import {PromptModalDialog} from "./dialog/PromptModalDialog";
import {taskSuccessClear} from "./task_slice";
import {platformTaskLink} from './platform/actionTypes';
import {ContextVisualizationImages} from './ContextVisualizationImages';
import {TestsPane} from '../submission/TestsPane';
import {TaskHintsDialog} from './dialog/TaskHintsDialog';
import {DebugDialog} from './dialog/DebugDialog';
import {LayoutPlayerMode, LayoutView} from './layout/layout_types';
import {useCursorPositionTracking} from './layout/cursor_tracking';
import {CursorPosition} from './layout/CursorPosition';

export function TaskApp() {
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);
    const recordingEnabled = useAppSelector(state => state.task.recordingEnabled);
    const playerEnabled = !!useAppSelector(state => state.options.audioUrl);
    const playerProgress = useAppSelector(state => state.player.progress);
    const isPlayerReady = useAppSelector(state => state.player.isReady);
    const options = useAppSelector(state => state.options);
    const layoutType = useAppSelector(state => state.layout.type);
    const layoutPlayerMode = useAppSelector(state => state.layout.playerMode);
    const editor = useAppSelector(state => state.editor);
    const displayEditor = editor && editor.playerReady;
    const displaySubtitlesPane = useAppSelector(state => !!(state.subtitles && state.subtitles.paneEnabled && state.subtitles.items && !!state.subtitles.items.length));
    const user = useAppSelector(state => state.user);
    const audioLoaded = editor.audioLoaded;
    const [initialUserCheck, setInitialUserCheck] = useState(false);
    const taskLevels = useAppSelector(state => state.platform.levels);
    const language = useAppSelector(state => state.options.language);
    const displayAbout = useAppSelector(state => selectDisplayAbout(state));
    const taskSuccess = useAppSelector(state => state.task.success);
    const activeView = useAppSelector(selectActiveView);
    const submissionsPaneOpen = useAppSelector(state => state.submission.submissionsPaneOpen);

    let progress = null;
    let progressMessage = null;
    if (options.baseDataUrl && CodecastOptionsMode.Edit === options.mode && !audioLoaded) {
        progress = editor.audioLoadProgress;
        progressMessage = getMessage('PLAYER_LOADING_AUDIO');
    } else if (playerEnabled && !isPlayerReady) {
        progress = playerProgress;
        progressMessage = getMessage('PLAYER_PREPARING');
    }

    const dispatch = useDispatch();

    useCursorPositionTracking();

    const closeTaskSuccess = () => {
        dispatch(taskSuccessClear({}));
    };

    useEffect(() => {
        document.documentElement.setAttribute('active-view', activeView);
    }, [activeView]);

    useEffect(() => {
        // Wait that the html is loaded before we create the context because some of them use jQuery to select elements
        if (options.theme) {
            document.documentElement.setAttribute('data-theme', options.theme);
        }

        setTimeout(() => {
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
            } else {
                // If we have a recording, taskLoad is triggered afterwards, in playerPrepare, when we have the events data and know the task
                // const taskLoadParameters: {level?: TaskLevelName} = {};
                // if (options.level) {
                //     taskLoadParameters.level = options.level;
                // }
                // dispatch(taskLoad(taskLoadParameters));
                dispatch(platformTaskLink());
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
        <Container key={language} fluid className={`task ${fullScreenActive ? 'full-screen' : ''} layout-${layoutType} task-player-${layoutPlayerMode} platform-${options.platform} cursor-main-zone`} data-cursor-zone="task-app">
            <div className="layout-general">
                <div className={`task-section`}>
                    {LayoutView.Task !== activeView && <TestsPane
                        open={submissionsPaneOpen}
                    />}

                    <div className="task-section-container">
                        <div className="task-header">
                            <span className="task-header__quick">QUICK</span>
                            <span className="task-header__algo">ALGO</span>
                        </div>

                        {taskLevels && 1 < Object.keys(taskLevels).length && <TaskLevelTabs/>}

                        <div className="task-body">
                            <LayoutLoader/>
                            {displayEditor &&
                                <div key="subtitles" className="subtitles-pane-container">
                                    <SubtitlesEditor
                                        light={true}
                                    />
                                    <SubtitlesEditorPane/>
                                </div>
                            }
                            {!displayEditor && displaySubtitlesPane &&
                                <div key="subtitles-view" className="subtitles-pane-container">
                                    <SubtitlesPane/>
                                </div>
                            }
                        </div>

                        {LayoutView.Task !== activeView && <MenuTask/>}
                    </div>

                    <ContextVisualizationImages/>
                </div>

                {recordingEnabled &&
                    <div className="layout-footer">
                        <RecorderControls/>
                    </div>
                }

                {/*<CursorPosition offset={{x: 20, y: 20}}/>*/}

                {playerEnabled && isPlayerReady &&
                    <div className="layout-footer">
                        <PlayerControls/>
                        {LayoutPlayerMode.Replay === layoutPlayerMode &&
                            <React.Fragment>
                                <CursorPosition/>
                                <SubtitlesBand/>
                            </React.Fragment>
                        }
                    </div>
                }

                {displayEditor &&
                    <div className="layout-footer editor-footer">
                        <EditorInterface/>
                    </div>
                }
            </div>

            <Dialog isOpen={!!progressMessage} title={progressMessage ? progressMessage : 'Info'} isCloseButtonShown={false}>
                <div style={{margin: '20px 20px 20px 20px'}}>
                    <ProgressBar value={progress} intent={Intent.SUCCESS}/>
                </div>

                {displayAbout && <div style={{margin: '20px 20px 0 20px'}}>
                    <TaskAbout/>
                </div>}
            </Dialog>

            <TaskHintsDialog/>

            {taskSuccess && <TaskSuccessDialog onClose={closeTaskSuccess}/>}

            <PromptModalDialog/>

            <DebugDialog/>
        </Container>
    );
}
