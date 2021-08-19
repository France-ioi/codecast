import {Dialog} from "@blueprintjs/core";
import {LanguageSelection} from "../lang/LanguageSelection";
import {ExamplePicker} from "./ExamplePicker";
import React from "react";
import {useAppSelector} from "../hooks";
import {isLocalMode} from "../utils/app";
import {select} from "redux-saga/effects";
import {StepperStatus} from "../stepper";
import {ActionTypes as CommonActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";
import {ActionTypes as IOActionTypes} from "../stepper/io/actionTypes";
import {ActionTypes as LayoutActionTypes} from "../task/layout/actionTypes";
import {IoMode} from "../stepper/io";

interface SettingsDialogProps {
    open: boolean,
    onClose: () => void,
}

export function SettingsDialog(props: SettingsDialogProps) {
    const {baseUrl, baseDataUrl, platform, canChangePlatform} = useAppSelector(state => state.options);
    const getMessage = useAppSelector(state => state.getMessage);
    const {mode: ioMode, modeSelect} = useAppSelector(state => state.ioPane);
    const stepper = useAppSelector(state => state.stepper);
    const ioModeSelect = modeSelect && (!stepper || stepper.status === StepperStatus.Clear);
    const recordingEnabled = useAppSelector(state => state.task.recordingEnabled);
    const layoutRequiredType = useAppSelector(state => state.layout.requiredType);

    let offlineDownloadUrl = null;
    if (!isLocalMode() && baseDataUrl) {
        offlineDownloadUrl = baseUrl + '/offline?recording=' + encodeURIComponent(baseDataUrl);
    }

    const dispatch = useDispatch();

    const setPlatform = (event) => {
        const platform = event.target.value;
        dispatch({
            type: CommonActionTypes.PlatformChanged,
            payload: platform
        });
    };

    const onIOModeChanged = (event) => {
        const mode = event.target.value;
        dispatch({type: IOActionTypes.IoPaneModeChanged, payload: {mode}});
    };

    const onLayoutRequiredTypeChanged = (event) => {
        const requiredLayout = event.target.value;
        dispatch({type: LayoutActionTypes.LayoutRequiredTypeChanged, payload: {requiredType: requiredLayout}});
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

    return (
        <Dialog icon='menu' title={getMessage('SETTINGS_MENU_TITLE')} isOpen={props.open} onClose={props.onClose}>
            <div className='bp3-dialog-body'>
                <div style={{marginBottom: '10px'}}>
                    <LanguageSelection closeMenu={props.onClose}/>
                </div>
                {canChangePlatform &&
                    <div>
                      <label className='bp3-label'>
                          {getMessage('PLATFORM_SETTING')}
                        <div className='bp3-select'>
                          <select onChange={setPlatform} value={platform}>
                            <option value='python'>{getMessage('PLATFORM_PYTHON')}</option>
                            <option value='unix'>{getMessage('PLATFORM_UNIX')}</option>
                            <option value='arduino'>{getMessage('PLATFORM_ARDUINO')}</option>
                          </select>
                        </div>
                      </label>
                    </div>
                }
                {ioModeSelect &&
                    <div>
                      <label className='bp3-label'>
                          {getMessage('IOPANE_MODE')}
                        <div className='bp3-select'>
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
                      <label className='bp3-label'>
                          {getMessage('LAYOUT_TYPE_REQUIRED_LABEL')}
                        <div className='bp3-select'>
                          <select value={layoutRequiredType} onChange={onLayoutRequiredTypeChanged}>
                              <option key="null" value={null}>{getMessage('NONE')}</option>
                              {layoutChoices.map(p =>
                                  <option
                                      key={p}
                                      value={p}
                                  >
                                      {p}
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
