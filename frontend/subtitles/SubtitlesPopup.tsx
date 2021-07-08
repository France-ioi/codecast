import React from "react";
import {Alert, Checkbox, Dialog, Intent, Radio, RadioGroup, Spinner} from "@blueprintjs/core";
import {setPersistentOption} from "./options";
import {ActionTypes} from './actionTypes';
import {useDispatch} from "react-redux";
import {useAppSelector} from "../hooks";

interface SubtitlesPopupProps {
    open: boolean,
    onClose: () => void,
}

export function SubtitlesPopup(props: SubtitlesPopupProps) {
    const {loadedKey, loading, lastError, availableOptions, langOptions, paneEnabled, bandEnabled} = useAppSelector(state => state.subtitles);
    const getMessage = useAppSelector(state => state.getMessage);
    const isLoaded = !loading && loadedKey !== 'none';
    const busy = !!loading;

    const availKeys = Object.keys(availableOptions).sort();

    const dispatch = useDispatch();

    const _selectSubtitles = (event) => {
        const key = event.target.value;
        if (key === 'none') {
            setPersistentOption("language", "none");

            dispatch({type: ActionTypes.SubtitlesCleared});
        } else {
            const option = availableOptions[key];

            setPersistentOption("language", option.value);

            dispatch({type: ActionTypes.SubtitlesLoadFromUrl, payload: option});
        }
    };
    const _changePaneEnabled = () => {
        dispatch({
            type: ActionTypes.SubtitlesPaneEnabledChanged,
            payload: {value: !paneEnabled}
        });
    };
    const _changeBandEnabled = () => {
        dispatch({
            type: ActionTypes.SubtitlesBandEnabledChanged,
            payload: {value: !bandEnabled}
        });
    };

    return (
        <Dialog icon='menu' title={getMessage('CLOSED_CAPTIONS_TITLE')} isOpen={props.open} onClose={props.onClose}>
            <div className='bp3-dialog-body'>
                {busy &&
                    <Spinner size={Spinner.SIZE_SMALL}/>
                }
                <RadioGroup name='subtitles' selectedValue={loadedKey} onChange={_selectSubtitles}>
                    <Radio value='none' label={getMessage('CLOSED_CAPTIONS_OFF')}/>
                    {availKeys.map(function(key) {
                        const option = langOptions.find(option => option.value === key);

                        return (
                            <Radio key={key} value={option.value}>
                                {option.label}
                            </Radio>
                        );
                    })}
                </RadioGroup>
                {lastError &&
                    <Alert intent={Intent.DANGER}>{lastError}</Alert>
                }
                <div className="mt-4">
                    <Checkbox disabled={!isLoaded} checked={paneEnabled} onChange={_changePaneEnabled}>
                        {getMessage('CLOSED_CAPTIONS_SHOW_PANE')}
                    </Checkbox>
                </div>
                <div>
                    <Checkbox disabled={!isLoaded} checked={bandEnabled} onChange={_changeBandEnabled}>
                        {getMessage('CLOSED_CAPTIONS_SHOW_BAND')}
                    </Checkbox>
                </div>
                {isLoaded &&
                    <div style={{textAlign: 'center'}} className="mt-4">
                        <a href={availableOptions[loadedKey].url} className='bp3-button bp3-small bp3-icon-download'
                           target='_blank' rel="noreferrer" download>
                            {getMessage('CLOSED_CAPTIONS_DOWNLOAD_SELECTED')}
                        </a>
                    </div>
                }
            </div>
        </Dialog>
    );
}
