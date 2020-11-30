import React from "react";
import {Alert, Button, Checkbox, Intent, Radio, RadioGroup, Spinner} from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {setPersistentOption} from "./options";
import {ActionTypes} from './actionTypes';

interface SubtitlesPopupProps {
    availableOptions: any,
    langOptions: any,
    loadedKey: any,
    isLoaded: any,
    busy: any,
    lastError: any,
    paneEnabled: any,
    bandEnabled: any,
    getMessage: any,
    closePortal: Function,
    dispatch: Function
}

export class SubtitlesPopup extends React.PureComponent<SubtitlesPopupProps> {
    render() {
        const {availableOptions, langOptions, loadedKey, isLoaded, busy, lastError, paneEnabled, bandEnabled, getMessage} = this.props;
        const availKeys = Object.keys(availableOptions).sort();

        return (
            <div className='menu-popup' onClick={this._close}>
                <div className='menu-popup-inset' onClick={this._stopPropagation} style={{width: '350px'}}>
                    <div className='pull-right'>
                        <Button onClick={this._close} icon={IconNames.CROSS}/>
                    </div>
                    <div className='menu-popup-title'>
                        {getMessage('CLOSED_CAPTIONS_TITLE')}
                        {busy && <Spinner size={Spinner.SIZE_SMALL}/>}
                    </div>
                    <RadioGroup name='subtitles' selectedValue={loadedKey} onChange={this._selectSubtitles}>
                        <Radio value='none' label={getMessage('CLOSED_CAPTIONS_OFF')}/>
                        {availKeys.map(function (key) {
                            const option = langOptions.find(option => option.value === key);
                            return (
                                <Radio key={key} value={option.value}>
                                    {option.label}
                                </Radio>
                            );
                        })}
                    </RadioGroup>
                    {lastError && <Alert intent={Intent.DANGER}>{lastError}</Alert>}
                    <div>
                        <Checkbox disabled={!isLoaded} checked={paneEnabled} onChange={this._changePaneEnabled}>
                            {getMessage('CLOSED_CAPTIONS_SHOW_PANE')}
                        </Checkbox>
                    </div>
                    <div>
                        <Checkbox disabled={!isLoaded} checked={bandEnabled} onChange={this._changeBandEnabled}>
                            {getMessage('CLOSED_CAPTIONS_SHOW_BAND')}
                        </Checkbox>
                    </div>
                    {isLoaded &&
                    <div style={{textAlign: 'center'}}>
                        <a href={availableOptions[loadedKey].url} className='bp3-button bp3-small bp3-icon-download'
                           target='_blank' download>
                            {getMessage('CLOSED_CAPTIONS_DOWNLOAD_SELECTED')}
                        </a>
                    </div>}
                </div>
            </div>
        );
    }

    _stopPropagation = (event) => {
        event.stopPropagation();
    };
    _close = (event) => {
        event.stopPropagation();

        this.props.closePortal();
    };
    _selectSubtitles = (event) => {
        const key = event.target.value;
        if (key === 'none') {
            setPersistentOption("language", "none");

            this.props.dispatch({type: ActionTypes.SubtitlesCleared});
        } else {
            const option = this.props.availableOptions[key];

            setPersistentOption("language", option.value);

            this.props.dispatch({type: ActionTypes.SubtitlesLoadFromUrl, payload: option});
        }
    };
    _changePaneEnabled = () => {
        this.props.dispatch({
            type: ActionTypes.SubtitlesPaneEnabledChanged,
            payload: {value: !this.props.paneEnabled}
        });
    };
    _changeBandEnabled = () => {
        this.props.dispatch({
            type: ActionTypes.SubtitlesBandEnabledChanged,
            payload: {value: !this.props.bandEnabled}
        });
    };
}
