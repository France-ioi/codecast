import React, {useState} from 'react';
import {Button, ButtonGroup, Dialog} from '@blueprintjs/core';
import {isLocalMode} from "../utils/app";
import {FullscreenButton} from "./FullscreenButton";
import {LanguageSelection} from "../lang/LanguageSelection";
import {ExamplePicker} from "./ExamplePicker";
import {ActionTypes} from "./actionTypes";
import {SubtitlesPopup} from "../subtitles/SubtitlesPopup";
import {useAppSelector} from "../hooks";
import {useDispatch} from "react-redux";

export function Menu() {
    const {baseUrl, baseDataUrl, platform, canChangePlatform} = useAppSelector(state => state.options);
    const getMessage =  useAppSelector(state => state.getMessage);
    let offlineDownloadUrl = null;
    if (!isLocalMode() && baseDataUrl) {
        offlineDownloadUrl = baseUrl + '/offline?recording=' + encodeURIComponent(baseDataUrl);
    }

    const [menuOpen, setMenuOpen] = useState(false);
    const [subtitlesOpen, setSubtitlesOpen] = useState(false);

    const dispatch = useDispatch();

    const setPlatform = (event) => {
        const platform = event.target.value;
        dispatch({
            type: ActionTypes.PlatformChanged,
            payload: platform
        });
    };

    return (
        <div id='menu'>
            <ButtonGroup>
                <Button
                    onClick={() => setSubtitlesOpen(!subtitlesOpen)}
                    className="btn-cc has-background"
                    title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s}
                    text='CC'
                />
                <SubtitlesPopup open={subtitlesOpen} onClose={() => setSubtitlesOpen(false)}/>
                <Button onClick={() => setMenuOpen(true)} icon='menu'/>
                <FullscreenButton />
            </ButtonGroup>
            <Dialog icon='menu' title={getMessage('SETTINGS_MENU_TITLE')} isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
                <div className='bp3-dialog-body'>
                    <div style={{marginBottom: '10px'}}>
                        <LanguageSelection closeMenu={() => setMenuOpen(false)}/>
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
                    {offlineDownloadUrl &&
                        <a href={offlineDownloadUrl} target="_blank" rel="noreferrer" className="offline-download-link">
                            {getMessage('DOWNLOAD_OFFLINE')}
                        </a>
                    }
                    <ExamplePicker />
                </div>
            </Dialog>
        </div>
    );
}
