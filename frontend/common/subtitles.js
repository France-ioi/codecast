
/*
  state.get('subtitles') =
  {
    availableOptions: {
      'en-US': {key: 'en-US', url: '...', removed: true},
      'fr-FR': {key: 'fr-FR', text: '...'},
    },
    selectedKey: 'en-US',
    items: [],
    currentIndex: 0,
    filteredItems: [],
    filterText: '',
    filterRegexp: null,
    loading: false,
    loadedKey: 'none',
  }
*/

import React from 'react';
import ReactDOM from 'react-dom';
import {RadioGroup, Radio} from 'react-radio-group';
import {Alert, Checkbox} from 'react-bootstrap';
import classnames from 'classnames';
import srtParse from 'subtitle/lib/parse';
import srtStringify from 'subtitle/lib/stringify';
import clickDrag from 'react-clickdrag';
import Portal from 'react-portal';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';
import Select from 'react-select';
import {takeLatest, put, call, select} from 'redux-saga/effects';
import request from 'superagent';
import Immutable from 'immutable';
//import FileInput from 'react-file-input';
import update from 'immutability-helper';
import Highlight from 'react-highlighter';

import {Button} from '../ui';
import {formatTime, formatTimeLong, readFileAsText} from './utils';
import FlagIcon from './flag_icon';

function SubtitlesMenuSelector (state, props) {
  const {SubtitlesPopup} = state.get('scope');
  const getMessage = state.get('getMessage');
  return {getMessage, Popup: SubtitlesPopup};
}

class SubtitlesMenu extends React.PureComponent {
  render() {
    const {getMessage, Popup} = this.props;
    const menuButton = (
      <Button title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s}>
        <i className='fa fa-cc'/>
      </Button>
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
            <Button onClick={this._close}>
              <i className='fa fa-times'/>
            </Button>
          </div>
          <div className='menu-popup-title'>
            {getMessage('CLOSED_CAPTIONS_TITLE')}
            {busy && <i className='fa fa-spinner fa-spin'/>}
          </div>
          <RadioGroup name='subtitles' selectedValue={loadedKey} onChange={this._selectSubtitles}>
            <div>
              <label>
                <Radio value='none' />
                {getMessage('CLOSED_CAPTIONS_OFF')}
              </label>
            </div>
            {availKeys.map(function (key) {
              const option = langOptions.find(option => option.value === key);
              return (
                <div key={key}>
                  <label>
                    <Radio value={key} />
                    <FlagIcon code={option.countryCode}/>
                    {option.label}
                  </label>
                </div>
              );
            })}
          </RadioGroup>
          {lastError && <Alert bsStyle='danger'>{lastError}</Alert>}
          {isLoaded &&
            <div>
              <a href={availableOptions[loadedKey].url} className='btn btn-default btn-sm' target='_blank' download>
                <i className='fa fa-download'/>
                {getMessage('CLOSED_CAPTIONS_DOWNLOAD_SELECTED')}
              </a>
            </div>}
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
  _selectSubtitles = (key) => {
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

/* SubtitlePaneItem is used in the *player* to show an item in the subtitles pane. */
class SubtitlePaneItem extends React.PureComponent {
  render() {
    const {item: {text, start, end}, selected, highlight} = this.props;
    const showTimestamps = false;
    return (
      <p className={classnames(['subtitles-item', selected && 'subtitles-item-selected'])} onClick={this._onClick}>
        {showTimestamps && <span className='subtitles-timestamp'>{formatTime(start)}</span>}
        <span className='subtitles-text'>
          <Highlight search={highlight||''}>{text}</Highlight>
        </span>
      </p>
    );
  }
  _onClick = () => {
    this.props.onJump(this.props.item);
  };
}

/* SubtitlePaneItemViewer is used in the *editor* to show an inactive item in the subtitles pane. */
class SubtitlePaneItemViewer extends React.PureComponent {
  render() {
    const {item: {text, start, end}} = this.props;
    return (
      <div className='subtitles-item-viewer' onClick={this._onClick}>
        <div className='subtitles-timestamp row'>
          <div className='col-sm-6'>
            <span className='subtitles-timestamp-start'>{formatTimeLong(start)}</span>
          </div>
          <div className='col-sm-6'>
            <span className='subtitles-timestamp-end'>{formatTimeLong(end)}</span>
          </div>
        </div>
        <span className='subtitles-text'>
          {text}
        </span>
      </div>
    );
  }
  _onClick = () => {
    this.props.onJump(this.props.item);
  };
}

/* SubtitlePaneItemViewer is used in the *editor* to show the selected, editable item in the subtitles pane. */
class SubtitlePaneItemEditor extends React.PureComponent {
  render() {
    const {item: {text, start, end}, offset, audioTime} = this.props;
    return (
      <div className='subtitles-item-editor'>
        <div className='subtitles-timestamp row'>
          <div className='col-sm-6'>
            <span className='pull-left'><Button bsSize='xsmall' disabled={start < 200} onClick={this._onShiftMinus}><i className='fa fa-chevron-left'/></Button></span>
            <span className='subtitles-timestamp-start'>{formatTimeLong(start)}</span>
            <span className='pull-right'><Button bsSize='xsmall' disabled={start !== 0 && end - start <= 200} onClick={this._onShiftPlus}><i className='fa fa-chevron-right'/></Button></span>
          </div>
          <div className='col-sm-6'>
            <span className='subtitles-timestamp-end'>{formatTimeLong(end)}</span>
            <span className='pull-right'><Button bsSize='xsmall' disabled={start === 0} onClick={this._onRemoveMergeUp}><i className='fa fa-minus'/></Button></span>
          </div>
        </div>
        <textarea className='subtitles-text' value={text} onChange={this._onChange} rows='6'/>
        <div className='subtitles-split row'>
          <p>{formatTimeLong(audioTime)}</p>
          <span className='pull-right'><Button bsSize='xsmall' disabled={offset === 0} onClick={this._onInsertBelow}><i className='fa fa-plus'/></Button></span>
        </div>
      </div>
    );
  }
  _onChange = (event) => {
    this.props.onChange(this.props.item, event.target.value);
  };
  _onInsertBelow = (event) => {
    const {item, offset} = this.props;
    this.props.onInsert(item, offset, 'below');
  };
  _onRemoveMergeUp = (event) => {
    this.props.onRemove(this.props.item, 'up');
  };
  _onShiftMinus = (event) => {
    this.props.onShift(this.props.item, -200);
  };
  _onShiftPlus = (event) => {
    this.props.onShift(this.props.item, 200);
  };
}

function SubtitlesPaneSelector (state, props) {
  const getMessage = state.get('getMessage');
  const {subtitlesItemChanged, subtitlesItemInserted, subtitlesItemRemoved,
    subtitlesItemShifted, subtitlesFilterTextChanged, playerSeek} = state.get('scope');
  /* TODO: pass paused / not paused to component, and  */
  const {items, filteredItems, currentIndex, mode, audioTime, filterText, filterRegexp} = state.get('subtitles');
  return {
    subtitlesItemChanged, subtitlesItemInserted, subtitlesItemRemoved,
    subtitlesItemShifted, subtitlesFilterTextChanged, playerSeek, getMessage,
    subtitles: mode === 'editor' ? items : filteredItems,
    currentIndex, mode, audioTime, filterText, filterRegexp};
}

/* SubtitlesPane is used in both *player* and *editor* mode. */
class SubtitlesPane extends React.PureComponent {
  render () {
    const {subtitles, currentIndex, mode, audioTime, filterText, filterRegexp, getMessage} = this.props;
    return (
      <div className='subtitles-pane'>
        {mode !== 'editor' &&
          <input type='text' onChange={this._filterTextChanged} value={filterText} />}
        {subtitles && subtitles.length > 0
          ? subtitles.map((st, index) => {
              const selected = currentIndex === index;
              if (mode !== 'editor') {
                const ref = selected && this._refSelected;
                return <SubtitlePaneItem key={index} item={st} ref={ref} selected={selected} mode={mode} onJump={this._jump} highlight={filterRegexp} />;
              }
              if (selected) {
                return <SubtitlePaneItemEditor key={index} item={st} ref={this._refSelected} offset={audioTime - st.start} audioTime={audioTime}
                  onChange={this._changeItem} onInsert={this._insertItem} onRemove={this._removeItem} onShift={this._shiftItem} />;
              }
              return <SubtitlePaneItemViewer key={index} item={st} onJump={this._jump} />;
            })
          : <p>{getMessage('CLOSED_CAPTIONS_NOT_LOADED')}</p>}
      </div>
    );
  }
  componentDidUpdate (prevProps) {
    if (this.props.currentIndex !== prevProps.currentIndex) {
      if (this._selectedComponent) {
        const domNode = ReactDOM.findDOMNode(this._selectedComponent);
        scrollIntoViewIfNeeded(domNode, {centerIfNeeded: true, easing: 'ease', duration: 300});
      }
    }
  }
  _refSelected = (component) => {
    this._selectedComponent = component;
  };
  _jump = (subtitle) => {
    this.props.dispatch({type: this.props.playerSeek, audioTime: subtitle.start});
  };
  _changeItem = (item, text) => {
    const index = this.props.subtitles.indexOf(item);
    this.props.dispatch({type: this.props.subtitlesItemChanged, payload: {index, text}});
  };
  _insertItem = (item, offset, where) => {
    const index = this.props.subtitles.indexOf(item);
    this.props.dispatch({type: this.props.subtitlesItemInserted, payload: {index, offset, where}});
  };
  _removeItem = (item, merge) => {
    const index = this.props.subtitles.indexOf(item);
    this.props.dispatch({type: this.props.subtitlesItemRemoved, payload: {index, merge}});
  };
  _shiftItem = (item, amount) => {
    const index = this.props.subtitles.indexOf(item);
    this.props.dispatch({type: this.props.subtitlesItemShifted, payload: {index, amount}});
  };
  _filterTextChanged = (event) => {
    const text = event.target.value;
    this.props.dispatch({type: this.props.subtitlesFilterTextChanged, payload: {text}});
  };
}

function SubtitlesBandSelector (state, props) {
  const {bandEnabled, loaded, items, currentIndex, itemVisible, isMoving, offsetY} = state.get('subtitles');
  const windowHeight = state.get('windowHeight');
  const geometry = state.get('mainViewGeometry');
  const scope = state.get('scope');
  return {
    top: 400,
    active: itemVisible, item: items && items[currentIndex], isMoving, offsetY, geometry, windowHeight,
    beginMove: scope.subtitlesBandBeginMove,
    endMove: scope.subtitlesBandEndMove,
    doMove: scope.subtitlesBandMoved,
  };
}

function getSubtitlesBandVisible (state) {
  const {loaded, bandEnabled} = state.get('subtitles');
  return loaded && bandEnabled;
}

class SubtitlesBand extends React.PureComponent {
  render () {
    const {active, item, offsetY, dataDrag: {isMoving}, geometry, top} = this.props;
    const translation = `translate(0px, ${this.state.currentY}px)`;
    return (
      <div className={classnames(['subtitles-band', `subtitles-band-${active?'':'in'}active`, isMoving && 'subtitles-band-moving', 'no-select', `mainView-${geometry.size}`])}
        style={{top: `${top}px`, transform: translation, width: `${geometry.width + 20/*padding*/}px`}} ref={this._refBand} >
        <div className='subtitles-band-frame'>
          {item && <p className='subtitles-text'>{item.text}</p>}
        </div>
      </div>
    );
  }
  componentWillReceiveProps (nextProps) {
    const height = (this._band ? this._band.offsetHeight : 40);
    if (nextProps.dataDrag.isMoving) {
      const newPositionY = this.state.lastPositionY + nextProps.dataDrag.moveDeltaY;
      const currentY = Math.min(nextProps.windowHeight - nextProps.top - height, Math.max(-nextProps.top, newPositionY));
      this.setState({currentY});
    } else {
      const currentY = Math.min(nextProps.windowHeight - nextProps.top - height, Math.max(-nextProps.top, this.state.currentY));
      this.setState({currentY, lastPositionY: currentY});
    }
  }
  state = {currentY: 0, lastPositionY: 0};
  _refBand = (element) => {
    this._band = element;
  }
}

/*
 *  Subtitles Editor
 */

function SubtitlesEditorSelector (state, props) {
  const {subtitlesSelected, subtitlesAddOption, subtitlesRemoveOption,
    subtitlesTextChanged, editorBeginEdit, editorSave} = state.get('scope');
  const notify = state.getIn(['editor', 'notify']);
  const {selectedKey, availableOptions, langOptions} = state.get('subtitles');
  const selected = selectedKey && availableOptions[selectedKey];
  const subtitlesText = selected && selected.text;
  return {availableOptions, selected, langOptions, subtitlesText,
    subtitlesSelected, subtitlesAddOption, subtitlesRemoveOption,
    subtitlesTextChanged, editorBeginEdit, editorSave, notify};
}

class SubtitlesEditor extends React.PureComponent {
  render () {
    const {availableOptions, selected, subtitlesText, langOptions, onSelect, onRemove, notify} = this.props;
    const availKeys = Object.keys(availableOptions).filter(key => !availableOptions[key].removed).sort();
    return (
      <div>
        <div className='row'>
          <div className='col-sm-6' style={{paddingRight: '10px'}}>
            <h3>{"Available options"}</h3>
            <div className='form-inline section'>
              <ul>
                {availKeys.map(key =>
                  <SubtitlesEditorOption key={key} option={availableOptions[key]} selected={selected && selected.key === key}
                    onSelect={this._selectOption} onRemove={this._removeOption} />)}
              </ul>
              <Select options={langOptions} onChange={this._addSubtitleOption} clearableValue={false}
                placeholder='Add language…' />
            </div>
          </div>
          {selected && <div className='col-sm-6' style={{paddingLeft: '10px'}}>
            <h3>{"Selected: "}<span style={{fontWeight: 'bold'}}>{selected.key}</span></h3>
            <textarea rows={7} style={{width: '100%'}} value={subtitlesText} onChange={this._onChange}/>
          </div>}
        </div>
        <div style={{marginTop: '2em', textAlign: 'center', backgroundColor: '#efefef', padding: '10px'}}>
          <span style={{marginRight: '10px'}}>
            <Button onClick={this._beginEdit}>
              <i className='fa fa-edit'/>{" Edit"}
            </Button>
          </span>
          <Button onClick={this._save}>
            <i className='fa fa-cloud-upload'/>
            {" Save "}
            {notify.key === 'pending' && <i className='fa fa-spinner fa-spin'/>}
            {notify.key === 'success' && <i className='fa fa-check' style={{color: 'green'}}/>}
            {notify.key === 'failure' && <i className='fa fa-exclamation-triangle' style={{color: 'red'}}/>}
          </Button>
        </div>
      </div>
    );
  }
  _refLoad = (el) => {
    this._loadInput = el;
  };
  _openLoadInput = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this._loadInput.click();
  };
  _selectOption = (option) => {
    this.props.dispatch({type: this.props.subtitlesSelected, payload: {option}});
  };
  _addSubtitleOption = (option) => {
    if (option) {
      const key = option.value;
      this.props.dispatch({type: this.props.subtitlesAddOption, payload: {key}});
    }
  };
  _removeOption = (option) => {
    const {key} = option;
    this.props.dispatch({type: this.props.subtitlesRemoveOption, payload: {key}});
  };
  _onChange = (event) => {
    const text = event.target.value;
    this.props.dispatch({type: this.props.subtitlesTextChanged, payload: {text}});
  };
  _beginEdit = (event) => {
    this.props.dispatch({type: this.props.editorBeginEdit});
  };
  _save = (event) => {
    this.props.dispatch({type: this.props.editorSave});
  };
}

class SubtitlesEditorOption extends React.PureComponent {
  render () {
    const {option, selected} = this.props;
    return (
      <li style={{listStyleType: 'none'}}>
        <Button onClick={this._select} active={selected}>
          {option.key}
        </Button>
        <Button onClick={this._remove}><i className='fa fa-remove'/></Button>
        {typeof option.text === 'string' &&
          <span>
            {' '}<i className='fa fa-save'/>
          </span>}
      </li>
    );
  }
  _select = (event) => {
    event.stopPropagation();
    this.props.onSelect(this.props.option);
  };
  _remove = (event) => {
    event.stopPropagation();
    this.props.onRemove(this.props.option);
  };
}

/*
 *  reducers
 */

function initReducer (state) {
  return state
    .set('subtitles', {
      filterText: '',
      filterRegexp: null,
      langOptions: [
        {value: 'fr-FR', label: "Français", countryCode: 'fr'},
        {value: 'en-US', label: "English",  countryCode: 'us'},
      ],
      paneEnabled: false,
      bandEnabled: true,
    })
    .setIn(['panes', 'subtitles'],
      Immutable.Map({
        View: state.get('scope').SubtitlesPane,
        enabled: false,
        width: 200,
      }));
}

function subtitlesModeSetReducer (state, {payload: {mode}}) {
  state = state.update('subtitles', subtitles => ({...subtitles, mode}));
  /* TODO: if mode is 'player', reload state from local storage settings? */
  state = updateSubtitlesPaneVisibility(state);
  return state;
}

function subtitlesPaneEnabledChangedReducer (state, {payload: {value}}) {
  state = state.update('subtitles', subtitles => ({...subtitles, paneEnabled: value}));
  state = updateSubtitlesPaneVisibility(state);
  return state;
}

function updateSubtitlesPaneVisibility (state) {
  const {mode, loading, loadedKey, paneEnabled} = state.get('subtitles');
  const isEditor = mode === 'editor';
  const isLoaded = !loading && loadedKey !== 'none';
  /* Editor: the subtitles pane is always visible.
     Player: the subtitles pane is visible if subtitles are loaded, and if
             the pane is enabled in the CC settings. */
  return state
    .setIn(['panes', 'subtitles', 'enabled'], (isEditor || isLoaded) && paneEnabled);
}

function subtitlesBandEnabledChangedReducer (state, {payload: {value}}) {
  return state.update('subtitles', subtitles => ({...subtitles, bandEnabled: value}));
}

function subtitlesFilterTextChangedReducer (state, {payload: {text}}) {
  return state.update('subtitles', function (subtitles) {
    let re = null;
    if (text) {
      try {
        re = new RegExp(text, 'i');
      } catch (ex) {
        /* silently ignore error, keep last regexp */
        re = subtitles.filterRegexp;
      }
    }
    return {
      ...subtitles,
      filterText: text,
      filterRegexp: re,
      filteredItems: filterItems(subtitles.items, re)
    };
  });
}

function filterItems (items, re) {
  if (!re) return items;
  return items.filter(item => -1 !== item.text.search(re));
}

function playerReadyReducer (state, {baseDataUrl, data}) {
  const availableOptions = {};
  (data.subtitles||[]).forEach(function (key) {
    const url = `${baseDataUrl}_${key}.srt`;
    availableOptions[key] = {key, url};
  });
  return state.update('subtitles', subtitles => (
    {...subtitles,
      availableOptions,
      items: [],
      filteredItems: [],
      currentIndex: 0,
      loadedKey: 'none'
    }));
}

function subtitlesClearedReducer (state, _action) {
  return state.update('subtitles', subtitles => (
    {...subtitles, loaded: false, text: '', items: [], filteredItems: [], currentIndex: 0, loadedKey: 'none'}));
}

function subtitlesLoadStartedReducer (state, {payload: {key}}) {
  return state.update('subtitles', subtitles => (
    {...subtitles, loaded: false, loading: key, lastError: false}));
}

function subtitlesLoadSucceededReducer (state, {payload: {key, text, items}}) {
  return state
    .update('subtitles', subtitles => (
      updateCurrentItem({
        ...subtitles, loaded: true, loading: false, loadedKey: key, text, items,
        filteredItems: filterItems(items, subtitles.filterRegexp)
      })));
}

function subtitlesSelectedReducer (state, {payload: {option}}) {
  return state.update('subtitles', subtitles => ({...subtitles, selectedKey: option.key}));
}

function subtitlesAddOptionReducer (state, {payload: {key}}) {
  return state.update('subtitles', function (subtitles) {
    const option = subtitles.availableOptions[key];
    if (!option || option.removed) {
      subtitles = update(subtitles, {availableOptions: {[key]: {$set: {key, text: ''}}}});
    }
    return subtitles;
  });
}

function subtitlesRemoveOptionReducer (state, {payload: {key}}) {
  return state.update('subtitles', function (subtitles) {
    return update(subtitles, {availableOptions: {[key]: {removed: {$set: true}}}});
  });
}

function subtitlesLoadFailedReducer (state, {payload: {error}}) {
  let errorText = state.get('getMessage')('SUBTITLES_FAILED_TO_LOAD').s;
  if (error.res) {
    errorText = `${errorText} (${error.res.statusCode})`;
  }
  return state.update('subtitles', subtitles => (
    {...subtitles, loaded: false, loading: false, lastError: errorText, text: errorText, loadedKey: 'none'}));
}

function playerSeekedReducer (state, action) {
  const {seekTo} = action;
  return state.update('subtitles', function (subtitles) {
    return updateCurrentItem(subtitles, seekTo);
  });
}

function playerTickReducer (state, action) {
  const {audioTime} = action;
  return state.update('subtitles', function (subtitles) {
    return updateCurrentItem(subtitles, audioTime);
  });
}

function subtitlesBandBeginMoveReducer (state, {payload: {y}}) {
  return state.update('subtitles', function (subtitles) {
    return {...subtitles, isMoving: true, startY: y};
  });
}

function subtitlesBandEndMoveReducer (state, _action) {
  return state.update('subtitles', function (subtitles) {
    return {...subtitles, isMoving: false};
  });
}

function subtitlesBandMovedReducer (state, {payload: {y}}) {
  return state.update('subtitles', function (subtitles) {
    return {...subtitles, offsetY: 10 - (y - subtitles.startY)};
  });
}

function subtitlesItemChangedReducer (state, {payload: {index, text}}) {
  /* Used only in the editor, filteredItems is not updated. */
  return state.update('subtitles', function (subtitles) {
    return update(subtitles, {items: {[index]: {text: {$set: text}}}})
  });
}

function subtitlesItemInsertedReducer (state, {payload: {index, offset, where}}) {
  return state.update('subtitles', function (subtitles) {
    const {start, end, text} = subtitles.items[index];
    const split = start + offset;
    if (start > split && split > end) return subtitles;
    let jumpTo = start;
    if (where === 'below') {
      subtitles = update(subtitles, {items: {$splice: [[index, 1,
        {start, end: split - 1, text}, {start: split, end, text: ''}]]}});
      jumpTo = split;
    }
    if (where === 'above') {
      subtitles = update(subtitles, {items: {$splice: [[index, 1,
        {start, end: split - 1, text: ''}, {start: split, end, text}]]}});
      jumpTo = start;
    }
    return updateCurrentItem(subtitles, jumpTo);
  });
}

function subtitlesItemRemovedReducer (state, {payload: {index, merge}}) {
  return state.update('subtitles', function (subtitles) {
    if (index === 0 && merge === 'up') return subtitles;
    if (index === subtitles.items.length - 1 && merge === 'down') return subtitles;
    const otherIndex = merge === 'up' ? index - 1 : index + 1;
    const firstIndex = Math.min(index, otherIndex);
    const {start} = subtitles.items[firstIndex];
    const {end} = subtitles.items[firstIndex + 1];
    const {text} = subtitles.items[otherIndex];
    return update(subtitles, {items: {$splice: [[firstIndex, 2, {start, end, text}]]}});
  });
}

function subtitlesItemShiftedReducer (state, {payload: {index, amount}}) {
  return state.update('subtitles', function (subtitles) {
    if (index === 0) return subtitles;
    function shift (ms) { return ms + amount; }
    return update(subtitles, {items: {
      [index-1]: {end: {$apply: shift}},
      [index]: {start: {$apply: shift}}
    }});
  });
}

function subtitlesTextChangedReducer (state, {payload: {text}}) {
  return state.update('subtitles', function (subtitles) {
    const {selectedKey: key} = subtitles;
    return update(subtitles, {availableOptions: {[key]: {text: {$set: text}}}});
  });
}

function subtitlesSaveReducer (state, action) {
  return state.update('subtitles', function (subtitles) {
    const {selectedKey: key, availableOptions, items} = subtitles;
    const text = srtStringify(items)
    return update(subtitles, {availableOptions: {[key]: {text: {$set: text}}}});
  });
}

function findSubtitleIndex (items, time) {
  let low = 0, high = items.length;
  while (low + 1 < high) {
    const mid = (low + high) / 2 | 0;
    const item = items[mid];
    if (item.start <= time) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
}

function updateCurrentItem (subtitles, audioTime) {
  if (!subtitles.items) return subtitles;
  if (audioTime === undefined) { audioTime = subtitles.audioTime; }
  const currentIndex = findSubtitleIndex(subtitles.items, audioTime);
  const currentItem = subtitles.items[currentIndex];
  const itemVisible = currentItem && currentItem.start <= audioTime && audioTime <= currentItem.end;
  return {...subtitles, audioTime, currentIndex, itemVisible};
}

/*
 * Sagas
 */

function getSubtitles (url) {
  return new Promise(function (resolve, reject) {
    var req = request.get(url);
    req.set('Accept', 'text/plain'); // XXX mime-type for srt?
    req.end(function (err, res) {
      if (err) return reject({err, res});
      resolve(res.text);
    });
  });
}

function subtitlesGetMenu (state) {
  const subtitles = state.get('subtitles');
  if (subtitles.mode === 'editor') return false;
  const playerData = state.getIn(['player', 'data']);
  if (!playerData || !playerData.subtitles || playerData.subtitles.length === 0) {
    return false;
  }
  return state.get('scope').SubtitlesMenu;
}

function* subtitlesSaga () {
  const scope = yield select(state => state.get('scope'));
  yield takeLatest(scope.subtitlesSelected, subtitlesSelectedSaga);
  yield takeLatest(scope.subtitlesLoadFromText, subtitlesLoadFromTextSaga);
  yield takeLatest(scope.subtitlesLoadFromUrl, subtitlesLoadFromUrlSaga);
  yield takeLatest(scope.subtitlesLoadFromFile, subtitlesLoadFromFileSaga);
  yield takeLatest(scope.subtitlesReload, subtitlesReloadSaga);
  yield takeLatest(scope.editorBeginEdit, editorBeginEditSaga);
  yield takeLatest(scope.editorSave, editorSaveSaga);
  yield takeLatest(scope.editorReturn, editorReturnSaga);
}

function* subtitlesSelectedSaga ({payload: {option}}) {
  /* Trigger loading of subtitles when first selected. */
  const scope = yield select(state => state.get('scope'));
  const {key, url, text} = option;
  if (url && !text) {
    const text = yield call(getSubtitles, url);
    yield put({type: scope.subtitlesTextChanged, payload: {text}});
  }
}

function* subtitlesLoadFromTextSaga ({payload: {key, text}}) {
  const scope = yield select(state => state.get('scope'));
  yield put({type: scope.subtitlesLoadStarted, payload: {key}});
  try {
    const items = srtParse(text);
    yield put({type: scope.subtitlesLoadSucceeded, payload: {key, text, items}});
  } catch (ex) {
    yield put({type: scope.subtitlesLoadFailed, payload: {error: ex}});
  }
}

function* subtitlesLoadFromUrlSaga ({payload: {key, url}}) {
  const scope = yield select(state => state.get('scope'));
  yield put({type: scope.subtitlesLoadStarted, payload: {key}});
  try {
    const text = yield call(getSubtitles, url);
    const items = srtParse(text);
    yield put({type: scope.subtitlesLoadSucceeded, payload: {key, text, items}});
  } catch (ex) {
    yield put({type: scope.subtitlesLoadFailed, payload: {error: ex}});
  }
}

function* subtitlesLoadFromFileSaga ({payload: {key, file}}) {
  const scope = yield select(state => state.get('scope'));
  try {
    const text = yield call(readFileAsText, file);
    const items = srtParse(text);
    yield put({type: scope.subtitlesLoadSucceeded, payload: {key, text, items}});
  } catch (ex) {
    yield put({type: scope.subtitlesLoadFailed, payload: {error: ex}});
  }
}

function* subtitlesReloadSaga (_action) {
  const scope = yield select(state => state.get('scope'));
  const {selectedKey: key, availableOptions} = yield select(state => state.get('subtitles'));
  if (key) {
    let text = (availableOptions[key].text || '').trim();
    if (!text) {
      const data = yield select(state => state.getIn(['player', 'data']));
      text = srtStringify([{start: 0, end: data.events[data.events.length - 1][0], text: ''}]);
    }
    let items;
    try {
      items = srtParse(text);
    } catch (ex) {
      yield put({type: scope.subtitlesLoadFailed, payload: {error: ex}});
      return;
    }
    yield put({type: scope.subtitlesLoadSucceeded, payload: {key, text, items}});
  }
}

function* editorBeginEditSaga (_action) {
  const {subtitlesReload, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: subtitlesReload});
  yield put({type: switchToScreen, payload: {screen: 'edit'}});
}

function* editorReturnSaga (_action) {
  const {switchToScreen, subtitlesSave} = yield select(state => state.get('scope'));
  yield put({type: subtitlesSave});
  yield put({type: switchToScreen, payload: {screen: 'setup'}});
}

function* editorSaveSaga (_action) {
  /* XXX valid for subtitles, code for trimming is completely different,
         so move to subtitles bundle */
  const {baseUrl, base, data, editorSaveFailed, editorSaveSucceeded} = yield select(function (state) {
    const {editorSaveFailed, editorSaveSucceeded} = state.get('scope');
    const baseUrl = state.get('baseUrl');
    const editor = state.get('editor');
    const base = editor.get('base');
    const data = editor.get('data');
    const subtitles = Object.values(state.get('subtitles').availableOptions);
    return {
      baseUrl, base, data: {...data, subtitles},
      editorSaveFailed, editorSaveSucceeded
    };
  });
  try {
    const result = yield call(postJson, `${baseUrl}/save`, {base, data});
    // TODO: pass new base as payload, when copying
    const timestamp = new Date();
    yield put({type: editorSaveSucceeded, payload: {timestamp}});
  } catch (ex) {
    console.log('error', ex);
    yield put({type: editorSaveFailed, payload: {error: ex.toString()}});
  }
}

function editorSaveReducer (state, action) {
  return state.setIn(['editor', 'notify'], {key: 'pending'});
}

function editorSaveFailedReducer (state, action) {
  return state.setIn(['editor', 'notify'], {key: 'failure', message: error.toString()});
}

function editorSaveSucceededReducer (state, {payload: {error}}) {
  return state.setIn(['editor', 'notify'], {key: 'success'});
}

module.exports = function (bundle) {

  bundle.use('getPlayerState', 'playerSeek');
  bundle.addReducer('init', initReducer);

  bundle.defineAction('subtitlesModeSet', 'Subtitles.Mode.Set');
  bundle.addReducer('subtitlesModeSet', subtitlesModeSetReducer);

  bundle.defineView('SubtitlesPane', SubtitlesPaneSelector, SubtitlesPane);
  bundle.defineAction('subtitlesPaneEnabledChanged', 'Subtitles.Pane.EnabledChanged');
  bundle.addReducer('subtitlesPaneEnabledChanged', subtitlesPaneEnabledChangedReducer);
  bundle.defineAction('subtitlesBandEnabledChanged', 'Subtitles.Band.EnabledChanged');
  bundle.addReducer('subtitlesBandEnabledChanged', subtitlesBandEnabledChangedReducer);
  bundle.defineAction('subtitlesFilterTextChanged', 'Subtitles.Pane.FilterText.Changed');
  bundle.addReducer('subtitlesFilterTextChanged', subtitlesFilterTextChangedReducer);

  bundle.defineValue('subtitlesGetMenu', subtitlesGetMenu);
  bundle.defineView('SubtitlesMenu', SubtitlesMenuSelector, SubtitlesMenu);
  bundle.defineView('SubtitlesPopup', SubtitlesPopupSelector, SubtitlesPopup);

  bundle.defineAction('subtitlesCleared', 'Subtitles.Cleared');
  bundle.addReducer('subtitlesCleared', subtitlesClearedReducer);
  bundle.addReducer('subtitlesLoadStarted', subtitlesLoadStartedReducer);
  bundle.defineAction('subtitlesLoadStarted', 'Subtitles.LoadStarted');
  bundle.addReducer('subtitlesLoadSucceeded', subtitlesLoadSucceededReducer);
  bundle.defineAction('subtitlesLoadSucceeded', 'Subtitles.LoadSucceeded');
  bundle.defineAction('subtitlesLoadFailed', 'Subtitles.LoadFailed');
  bundle.addReducer('subtitlesLoadFailed', subtitlesLoadFailedReducer);
  bundle.defineAction('subtitlesLoadFromText', 'Subtitles.LoadFromText');
  bundle.defineAction('subtitlesLoadFromUrl', 'Subtitles.LoadFromUrl');
  bundle.defineAction('subtitlesLoadFromFile', 'Subtitles.LoadFromFile');
  bundle.defineAction('subtitlesReload', 'Subtitles.Reload');

  bundle.defineAction('subtitlesSelected', 'Subtitles.Selected');
  bundle.addReducer('subtitlesSelected', subtitlesSelectedReducer);
  bundle.defineAction('subtitlesAddOption', 'Subtitles.AddOption');
  bundle.addReducer('subtitlesAddOption', subtitlesAddOptionReducer);
  bundle.defineAction('subtitlesRemoveOption', 'Subtitles.Option.Remove');
  bundle.addReducer('subtitlesRemoveOption', subtitlesRemoveOptionReducer);

  bundle.defineValue('getSubtitlesBandVisible', getSubtitlesBandVisible);
  bundle.defineView('SubtitlesBand', SubtitlesBandSelector,
    clickDrag(SubtitlesBand, {touch: true}));
  bundle.defineAction('subtitlesBandBeginMove', 'Subtitles.Band.BeginMove');
  bundle.addReducer('subtitlesBandBeginMove', subtitlesBandBeginMoveReducer);
  bundle.defineAction('subtitlesBandEndMove', 'Subtitles.Band.EndMove');
  bundle.addReducer('subtitlesBandEndMove', subtitlesBandEndMoveReducer);
  bundle.defineAction('subtitlesBandMoved', 'Subtitles.Band.Moved');
  bundle.addReducer('subtitlesBandMoved', subtitlesBandMovedReducer);

  bundle.addReducer('playerSeeked', playerSeekedReducer);
  bundle.addReducer('playerTick', playerTickReducer);
  bundle.addReducer('playerReady', playerReadyReducer);

  bundle.defineView('SubtitlesEditor', SubtitlesEditorSelector, SubtitlesEditor);

  bundle.defineAction('subtitlesItemChanged', 'Subtitles.Item.Changed');
  bundle.addReducer('subtitlesItemChanged', subtitlesItemChangedReducer);
  bundle.defineAction('subtitlesItemInserted', 'Subtitles.Item.Inserted');
  bundle.addReducer('subtitlesItemInserted', subtitlesItemInsertedReducer);
  bundle.defineAction('subtitlesItemRemoved', 'Subtitles.Item.Removed');
  bundle.addReducer('subtitlesItemRemoved', subtitlesItemRemovedReducer);
  bundle.defineAction('subtitlesItemShifted', 'Subtitles.Item.Shifted');
  bundle.addReducer('subtitlesItemShifted', subtitlesItemShiftedReducer);

  bundle.defineAction('subtitlesTextChanged', 'Subtitles.Text.Changed');
  bundle.addReducer('subtitlesTextChanged', subtitlesTextChangedReducer);
  bundle.defineAction('subtitlesSave', 'Subtitles.Save');
  bundle.addReducer('subtitlesSave', subtitlesSaveReducer);

  bundle.defineAction('editorBeginEdit', 'Editor.BeginEdit');
  bundle.defineAction('editorReturn', 'Editor.Return'); /* done editing, return to setup screen */

  bundle.defineAction('editorSave', 'Editor.Save');
  bundle.defineAction('editorSaveFailed', 'Editor.Save.Failed');
  bundle.defineAction('editorSaveSucceeded', 'Editor.Save.Succeeded');
  bundle.addReducer('editorSave', editorSaveReducer);
  bundle.addReducer('editorSaveFailed', editorSaveFailedReducer);
  bundle.addReducer('editorSaveSucceeded', editorSaveSucceededReducer);

  bundle.addSaga(subtitlesSaga);

};
