import React, {useEffect, useRef, useState} from 'react';
import {Dialog, Icon} from '@blueprintjs/core';
import {MenuIconsTask} from "./MenuIconsTask";
import {recordingEnabledChange} from "./task_slice";
import {SettingsDialog} from "../common/SettingsDialog";
import {EditRecordingDialog} from "../editor/EditRecordingDialog";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as BufferActionTypes} from "../buffers/actionTypes";
import {Screen} from "../common/screens";
import {getMessage} from "../lang";
import {selectDisplayAbout, TaskAbout} from "./TaskAbout";
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";
import {hasBlockPlatform} from "../stepper/js";
import {getJsLibLoaded} from "./libs/import_modules";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faDownload} from '@fortawesome/free-solid-svg-icons/faDownload';
import {faUpload} from '@fortawesome/free-solid-svg-icons/faUpload';

export function MenuTask() {
    const recordingEnabled = useAppSelector(state => state.task.recordingEnabled);
    const playerEnabled = useAppSelector(state => !!(state.options.audioUrl));
    const editorEnabled = useAppSelector(state => state.editor && state.editor.playerReady);
    const screen = useAppSelector(state => state.screen);
    const platform = useAppSelector(state => state.options.platform);
    const canRecord = useAppSelector(state => state.options.canRecord);
    const displayAbout = useAppSelector(state => selectDisplayAbout(state));

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);

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
            && !event.target.closest('.bp3-portal')
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
    };

    const toggleEditRecording = () => {
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.EditorSave}});
    };

    const closeEditRecording = () => {
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: null}});
    };

    const downloadAnswer = () => {
        dispatch({type: BufferActionTypes.BufferDownload});
    };

    const reloadAnswer = () => {
        dispatch({type: BufferActionTypes.BufferReload});
    };

    const forceSettingsOpen = hasBlockPlatform(platform) && platform !== getJsLibLoaded() && null !== getJsLibLoaded();

    return (
        <div ref={wrapperRef} className={`menu-container ${menuOpen ? 'is-open' : ''}`}>
            {screen !== Screen.DocumentationSmall && screen !== Screen.DocumentationBig && <div className="menu-icons">
                <MenuIconsTask
                    toggleMenu={() => setMenuOpen(!menuOpen)}
                    toggleDocumentation={toggleDocumentation}
                />
            </div>}
            <div className={`task-menu`}>
                <div className="menu-item" onClick={() => setSettingsOpen(!settingsOpen)}>
                    <Icon icon="cog"/>
                    <span>{getMessage('MENU_SETTINGS')}</span>
                </div>
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
                <div className="menu-item" onClick={downloadAnswer}>
                    <FontAwesomeIcon icon={faDownload}/>
                    <span>{getMessage('MENU_DOWNLOAD')}</span>
                </div>
                <div className="menu-item" onClick={reloadAnswer}>
                    <FontAwesomeIcon icon={faUpload}/>
                    <span>{getMessage('MENU_RELOAD')}</span>
                </div>
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
            <Dialog title={getMessage('MENU_ABOUT')} isOpen={aboutOpen} onClose={() => setAboutOpen(false)}>
                <div className='bp3-dialog-body'>
                    <TaskAbout/>
                </div>
            </Dialog>
        </div>
    );
}
