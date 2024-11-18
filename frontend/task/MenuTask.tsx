import React, {useEffect, useRef, useState} from 'react';
import {Dialog, Icon} from '@blueprintjs/core';
import {MenuIconsTask} from "./MenuIconsTask";
import {recordingEnabledChange} from "./task_slice";
import {SettingsDialog} from "../common/SettingsDialog";
import {EditRecordingDialog} from "../editor/EditRecordingDialog";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {Screen} from "../common/screens";
import {getMessage} from "../lang";
import {selectDisplayAbout, TaskAbout} from "./TaskAbout";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {getJsLibLoaded} from "./libs/import_modules";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faDownload} from '@fortawesome/free-solid-svg-icons/faDownload';
import {faUpload} from '@fortawesome/free-solid-svg-icons/faUpload';
import {PrinterLib} from './libs/printer/printer_lib';
import {displayModal} from '../common/prompt_modal';
import {ModalType} from '../common/modal_slice';
import {LayoutMobileMode, LayoutType} from './layout/layout_types';
import {hasBlockPlatform} from '../stepper/platforms';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';
import {bufferDownload, bufferReload} from '../buffers/buffer_actions';
import {isServerTask} from './task_types';
import {LocalWorkDialog} from './LocalWorkDialog';
import {IconNames} from '@blueprintjs/icons';
import { SmartContractLib } from './libs/smart_contract/smart_contract_lib';
import {WorkWithGitDialog} from './WorkWithGitDialog';

export function MenuTask() {
    const recordingEnabled = useAppSelector(state => state.task.recordingEnabled);
    const playerEnabled = useAppSelector(state => !!(state.options.audioUrl));
    const editorEnabled = useAppSelector(state => state.editor && state.editor.playerReady);
    const screen = useAppSelector(state => state.screen);
    const platform = useAppSelector(state => state.options.platform);
    const canRecord = useAppSelector(state => state.options.canRecord);
    const hideSettings = useAppSelector(state => state.options.hideSettings);
    const displayAbout = useAppSelector(state => selectDisplayAbout(state));
    const currentTask = useAppSelector(state => state.task.currentTask);
    const serverTask = null !== currentTask && isServerTask(currentTask);

    const layoutMobileMode = useAppSelector(state => state.layout.mobileMode);
    const layoutType = useAppSelector(state => state.layout.type);
    const isMobile = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [localWorkOpen, setLocalWorkOpen] = useState(false);
    const [workWithGitOpen, setWorkWithGitOpen] = useState(false);

    const controls = useAppSelector(state => state.options.controls);

    const context = quickAlgoLibraries.getContext(null, 'main');
    // Display the local work button by default for smart contract tasks
    const canLocalWork = serverTask && ('localwork' in controls || (context && context instanceof SmartContractLib));

    const canWorkWithGit = useAppSelector(state => serverTask && state.options.workWithGit);

    const wrapperRef = useRef<HTMLDivElement>();
    const dispatch = useDispatch();

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        }
    })

    const handleClickOutside = (event) => {
        if (
            wrapperRef.current
            && !wrapperRef.current.contains(event.target)
            && !event.target.closest('.bp4-portal')
            && menuOpen
        ) {
            setMenuOpen(false);
        }
    }

    const toggleDocumentation = () => {
        const newScreen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen ? null : Screen.DocumentationSmall;
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: newScreen}});
    };

    const toggleRecording = () => {
        dispatch(recordingEnabledChange(!recordingEnabled));
        setMenuOpen(false);

        if (!recordingEnabled) {
            const context = quickAlgoLibraries.getContext(null, 'main');
            if (context && !('robot' in context || context instanceof PrinterLib || 'quickpi' in context || 'database' in context || 'opencv' in context)) {
                dispatch(displayModal({message: getMessage('RECORDING_LIBRARY_NOT_WORKING'), mode: ModalType.message}));
            }
        }
    };

    const toggleEditRecording = () => {
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.EditorSave}});
    };

    const closeEditRecording = () => {
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: null}});
    };

    const downloadAnswer = () => {
        dispatch(bufferDownload());
    };

    const reloadAnswer = () => {
        dispatch(bufferReload());
    };

    const forceSettingsOpen = hasBlockPlatform(platform) && platform !== getJsLibLoaded() && null !== getJsLibLoaded();

    return (
        <div ref={wrapperRef} className={`menu-container ${menuOpen ? 'is-open' : ''}`}>
            {screen !== Screen.DocumentationSmall
                && screen !== Screen.DocumentationBig
                && (!isMobile || LayoutMobileMode.Editor === layoutMobileMode)
                && <div className="menu-icons">
                    <MenuIconsTask
                        toggleMenu={() => setMenuOpen(!menuOpen)}
                        toggleDocumentation={toggleDocumentation}
                    />
                </div>}
            <div className={`task-menu`}>
                {!hideSettings && <div className="menu-item" onClick={() => setSettingsOpen(!settingsOpen)}>
                    <Icon icon="cog"/>
                    <span>{getMessage('MENU_SETTINGS')}</span>
                </div>}
                {!playerEnabled && canRecord && <div className="menu-item" onClick={toggleRecording}>
                    <Icon icon="record" color="#ff001f"/>
                    <span>{getMessage('MENU_RECORDER')}</span>
                </div>}
                {editorEnabled && <div className="menu-item" onClick={toggleEditRecording}>
                    <Icon icon="edit"/>
                    <span>{getMessage('MENU_EDIT_RECORDING')}</span>
                </div>}
                {displayAbout && <div className="menu-item" onClick={() => setAboutOpen(!aboutOpen)}>
                    <Icon icon="help"/>
                    <span>{getMessage('MENU_ABOUT')}</span>
                </div>}
                {!(controls && 'reload' in controls && (false === controls['reload'] || '_' === controls['reload'])) &&
                    <React.Fragment>
                        <div className="menu-item" onClick={downloadAnswer}>
                            <FontAwesomeIcon icon={faDownload}/>
                            <span>{getMessage('MENU_DOWNLOAD')}</span>
                        </div>
                        <div className="menu-item" onClick={reloadAnswer}>
                            <FontAwesomeIcon icon={faUpload}/>
                            <span>{getMessage('MENU_RELOAD')}</span>
                        </div>
                    </React.Fragment>
                }
                {canLocalWork && <div className="menu-item" onClick={() => setLocalWorkOpen(!localWorkOpen)}>
                    <Icon icon={IconNames.Console}/>
                    <span>{getMessage('MENU_LOCAL')}</span>
                </div>}
                {canWorkWithGit && <div className="menu-item" onClick={() => setWorkWithGitOpen(!workWithGitOpen)}>
                    <Icon icon={IconNames.GIT_BRANCH}/>
                    <span>{getMessage('MENU_SYNC_GIT')}</span>
                </div>}
            </div>
            <SettingsDialog
                open={settingsOpen || forceSettingsOpen}
                closable={!forceSettingsOpen}
                onClose={() => setSettingsOpen(false)}
            />
            <EditRecordingDialog
                open={screen === Screen.EditorSave}
                onClose={closeEditRecording}
            />
            <LocalWorkDialog
                open={localWorkOpen}
                onClose={() => setLocalWorkOpen(false)}
            />
            <WorkWithGitDialog
                open={workWithGitOpen}
                onClose={() => setWorkWithGitOpen(false)}
            />
            <Dialog title={getMessage('MENU_ABOUT')} isOpen={aboutOpen} onClose={() => setAboutOpen(false)}>
                <div className='bp4-dialog-body'>
                    <TaskAbout/>
                </div>
            </Dialog>
        </div>
    );
}
