
import React from 'react';
import {Alert, Button, Checkbox, Intent, Radio, RadioGroup} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import Portal from 'react-portal';

export default function (bundle) {

  bundle.defineView('SubtitlesMenu', SubtitlesMenuSelector, SubtitlesMenu);
  bundle.defineView('SubtitlesPopup', SubtitlesPopupSelector, SubtitlesPopup);

}

function SubtitlesMenuSelector (state, props) {
  const subtitles = state.get('subtitles');
  if (subtitles.editing) return {hidden: true};
  const playerData = state.getIn(['player', 'data']);
  if (!playerData || !playerData.subtitles || playerData.subtitles.length === 0) {
    return {hidden: true};
  }
  const {SubtitlesPopup} = state.get('scope');
  const getMessage = state.get('getMessage');
  return {getMessage, Popup: SubtitlesPopup};
}

class SubtitlesMenu extends React.PureComponent {
  render() {
    const {hidden, getMessage, Popup} = this.props;
    if (hidden) return false;
    const menuButton = (
      <Button title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s} icon={<i className='pt-icon fa fa-cc'/>}/>
    );
    return (
      <Portal closeOnEsc closeOnOutsideClick openByClickOn={menuButton}>
        <Popup/>
      </Portal>
    );
  }
}

function SubtitlesPopupSelector (state, props) {
  const {loadedKey, loading, lastError, availableOptions, langOptions, paneEnabled, bandEnabled} = state.get('subtitles');
  const {subtitlesCleared, subtitlesLoadFromUrl, subtitlesPaneEnabledChanged, subtitlesBandEnabledChanged} = state.get('scope');
  const getMessage = state.get('getMessage');
  const isLoaded = !loading && loadedKey !== 'none';
  return {
    availableOptions, langOptions, loadedKey, isLoaded, busy: !!loading, lastError,
    subtitlesCleared, subtitlesLoadFromUrl,
    paneEnabled, subtitlesPaneEnabledChanged,
    bandEnabled, subtitlesBandEnabledChanged, getMessage
  };
}

class SubtitlesPopup extends React.PureComponent {
  render () {
    const {availableOptions, langOptions, loadedKey, isLoaded, busy, lastError, paneEnabled, bandEnabled, getMessage} = this.props;
    const availKeys = Object.keys(availableOptions).sort();
    return (
      <div className='menu-popup' onClick={this._close}>
        <div className='menu-popup-inset' onClick={this._stopPropagation} style={{width:'350px'}}>
          <div className='pull-right'>
            <Button onClick={this._close} icon={IconNames.CROSS}/>
          </div>
          <div className='menu-popup-title'>
            {getMessage('CLOSED_CAPTIONS_TITLE')}
            {busy && <i className='fa fa-spinner fa-spin'/>}
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
              <a href={availableOptions[loadedKey].url} className='pt-button pt-small pt-icon-download' target='_blank' download>
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
      this.props.dispatch({type: this.props.subtitlesCleared});
    } else {
      const option = this.props.availableOptions[key];
      this.props.dispatch({type: this.props.subtitlesLoadFromUrl, payload: option});
    }
  };
  _changePaneEnabled = () => {
    this.props.dispatch({
      type: this.props.subtitlesPaneEnabledChanged,
      payload: {value: !this.props.paneEnabled}});
  };
  _changeBandEnabled = () => {
    this.props.dispatch({
      type: this.props.subtitlesBandEnabledChanged,
      payload: {value: !this.props.bandEnabled}});
  };
}
