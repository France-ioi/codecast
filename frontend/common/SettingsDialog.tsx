import {Dialog} from "@blueprintjs/core";
import {LanguageSelection} from "../lang/LanguageSelection";
import {ExamplePicker} from "./ExamplePicker";
import React from "react";
import {useAppSelector} from "../hooks";
import {isLocalMode} from "../utils/app";
import {select} from "typed-redux-saga";
import {StepperStatus} from "../stepper";
import {useDispatch} from "react-redux";
import {ActionTypes as IOActionTypes} from "../stepper/io/actionTypes";
import {ActionTypes as LayoutActionTypes} from "../task/layout/actionTypes";
import {IoMode} from "../stepper/io";
import {getMessage} from "../lang";
import {PlatformSelection} from './PlatformSelection';
import {getJsLibLoaded} from '../task/libs/import_modules';
import {hasBlockPlatform} from '../stepper/platforms';
import {CodecastPlatform} from '../stepper/codecast_platform';

interface SettingsDialogProps {
    open: boolean,
    closable?: boolean,
    onClose: () => void,
}

export function SettingsDialog(props: SettingsDialogProps) {
    const {baseUrl, baseDataUrl, platform, canChangePlatform, canChangeLanguage, canDownload} = useAppSelector(state => state.options);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const ioMode = useAppSelector(state => state.options.ioMode);
    const stepper = useAppSelector(state => state.stepper);
    const ioModeSelect = CodecastPlatform.Arduino !== platform && (!stepper || stepper.status === StepperStatus.Clear) && !currentTask;
    const recordingEnabled = useAppSelector(state => state.task.recordingEnabled);
    const layoutRequiredType = useAppSelector(state => state.layout.requiredType);

    let offlineDownloadUrl = null;
    if (!isLocalMode() && baseDataUrl && canDownload) {
        offlineDownloadUrl = baseUrl + '/offline?recording=' + encodeURIComponent(baseDataUrl);
    }

    const dispatch = useDispatch();

    const onIOModeChanged = (event) => {
        const mode = event.target.value;
        dispatch({type: IOActionTypes.IoPaneModeChanged, payload: {mode}});
    };

    const onLayoutRequiredTypeChanged = (event) => {
        const requiredLayout = event.target.value;
        dispatch({type: LayoutActionTypes.LayoutRequiredTypeChanged, payload: {requiredType: requiredLayout ? requiredLayout : null}});
    };

    const modeOptions = [
        {value: IoMode.Split, label: 'IOPANE_MODE_SPLIT'},
        {value: IoMode.Terminal, label: 'IOPANE_MODE_INTERACTIVE'}
    ];

    const layoutChoices = [
        'DefaultLayoutDesktop',
        'DefaultLayoutTabletVertical',
        'DefaultLayoutMobileHorizontalEditor',
        'DefaultLayoutMobileHorizontalInstructions',
        'DefaultLayoutMobileHorizontalPlayer',
        'DefaultLayoutMobileVerticalEditor',
        'DefaultLayoutMobileVerticalInstructions',
        'DefaultLayoutMobileVerticalPlayer',
    ];

    const forceSettingsOpen = hasBlockPlatform(platform) && platform !== getJsLibLoaded() && null !== getJsLibLoaded();

    const closable = props.closable !== false;

    return (
        <Dialog icon='menu' title={getMessage('SETTINGS_MENU_TITLE')} isOpen={props.open} onClose={props.onClose} canEscapeKeyClose={closable} canOutsideClickClose={closable} isCloseButtonShown={closable}>
            <div className='bp4-dialog-body'>
                {canChangeLanguage && <div style={{marginBottom: '10px'}}>
                    <LanguageSelection closeMenu={props.onClose}/>
                </div>}
                {(canChangePlatform || forceSettingsOpen) &&
                    <PlatformSelection/>
                }
                {ioModeSelect &&
                    <div>
                        <label className='bp4-label'>
                            {getMessage('IOPANE_MODE')}
                            <div className='bp4-select'>
                                <select value={ioMode} onChange={onIOModeChanged}>
                                    {modeOptions.map(p =>
                                        <option
                                            key={p.value}
                                            value={p.value}
                                        >
                                            {getMessage(p.label)}
                                        </option>)}
                                </select>
                            </div>
                        </label>
                    </div>
                }
                {recordingEnabled &&
                    <div>
                        <label className='bp4-label'>
                            {getMessage('LAYOUT_TYPE_REQUIRED_LABEL')}
                            <div className='bp4-select'>
                                <select value={layoutRequiredType || ''} onChange={onLayoutRequiredTypeChanged}>
                                    <option key="null" value={''}>{getMessage('NONE')}</option>
                                    {layoutChoices.map(p =>
                                        <option
                                            key={p}
                                            value={p}
                                        >
                                            {getMessage('LAYOUT_' + p)}
                                        </option>)}
                                </select>
                            </div>
                        </label>
                    </div>
                }
                {offlineDownloadUrl &&
                    <a href={offlineDownloadUrl} target="_blank" rel="noreferrer" className="offline-download-link">
                        {getMessage('DOWNLOAD_OFFLINE')}
                    </a>
                }
                <ExamplePicker />
            </div>
        </Dialog>
    );
}
