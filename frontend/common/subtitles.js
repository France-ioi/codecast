
import React from 'react';
import ReactDOM from 'react-dom';
import {Alert} from 'react-bootstrap';
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
import FileInput from 'react-file-input';
import update from 'immutability-helper';

import {Button} from '../ui';
import {formatTime, formatTimeLong} from './utils';

function readFileAsText (file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function (event) { resolve(event.target.result); };
    reader.onerror = function (event) { reject(event.target.error); };
    reader.readAsText(file, 'utf-8');
  });
}

class SubtitlesMenu extends React.PureComponent {
  render() {
    const {getMessage, Popup} = this.props;
    const menuButton = (
      <Button title={getMessage("CLOSED_CAPTIONS").s}>
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

class SubtitlesPopup extends React.PureComponent {
  render () {
    const {availableOptions, loadedKey, busy, lastError, paneEnabled} = this.props;
    const availKeys = Object.keys(availableOptions).sort();
    return (
      <div className='menu-popup' onClick={this._close}>
        <div className='menu-popup-inset' onClick={this._stopPropagation}>
          <div className='pull-right'>
            {busy && <i className='fa fa-spinner fa-spin'/>}
            <Button onClick={this._close}>
              <i className='fa fa-times'/>
            </Button>
          </div>
          <ul>
            <Button onClick={this._clearSubtitles} active={!loadedKey}>{"off"}</Button>
            {availKeys.map(key =>
              <SubtitlesOption key={key} option={availableOptions[key]} loaded={key === loadedKey} onSelect={this._selectSubtitles} />)}
          </ul>
          {lastError && <Alert bsStyle='danger'>{lastError}</Alert>}
          <p onClick={this._changePaneEnabled} style={{cursor: 'pointer'}}>
            {paneEnabled ? '☑' : '☐'}{" show pane"}
          </p>
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
  _clearSubtitles = () => {
    this.props.dispatch({type: this.props.subtitlesCleared});
  };
  _selectSubtitles = ({key, url}) => {
    this.props.dispatch({type: this.props.subtitlesLoadFromUrl, payload: {key, url}});
  };
  _changePaneEnabled = () => {
    this.props.dispatch({
      type: this.props.subtitlesPaneEnabledChanged,
      payload: {value: !this.props.paneEnabled}});
  }
}

class SubtitlesOption extends React.PureComponent {
  render () {
    const {option, loaded} = this.props;
    return <Button onClick={this._clicked} active={loaded}>{option.key}</Button>;
  }
  _clicked = () => {
    this.props.onSelect(this.props.option);
  };
}

class SubtitlePaneItem extends React.PureComponent {
  render() {
    const {item: {text, start, end}, selected} = this.props;
    return (
      <p className={classnames(['subtitles-item', selected && 'subtitles-item-selected'])} onClick={this._onClick}>
        <span className='subtitles-timestamp'>{formatTime(start)}</span>
        <span className='subtitles-text'>{text}</span>
      </p>
    );
  }
  _onClick = () => {
    this.props.onJump(this.props.item);
  };
}

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

class SubtitlePaneItemEditor extends React.PureComponent {
  render() {
    const {item: {text, start, end}, offset, audioTime} = this.props;
    return (
      <div className='subtitles-item-editor'>
        <div className='subtitles-timestamp row'>
          <div className='col-sm-6'>
            <Button bsSize='xsmall' disabled={start < 250} onClick={this._onShiftMinus}><i className='fa fa-chevron-left'/></Button>
            <span className='subtitles-timestamp-start'>{formatTimeLong(start)}</span>
            <span className='pull-right'><Button bsSize='xsmall' disabled={start !== 0 && end - start <= 250} onClick={this._onShiftPlus}><i className='fa fa-chevron-right'/></Button></span>
          </div>
          <div className='col-sm-6'>
            <span className='subtitles-timestamp-end'>{formatTimeLong(end)}</span>
            <span className='pull-right'><Button bsSize='xsmall' disabled={start === 0} onClick={this._onRemoveMergeUp}><i className='fa fa-minus'/></Button></span>
          </div>
        </div>
        <textarea className='subtitles-text' value={text} onChange={this._onChange}/>
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
    this.props.onShift(this.props.item, -250);
  };
  _onShiftPlus = (event) => {
    this.props.onShift(this.props.item, 250);
  };
}

class SubtitlesPane extends React.PureComponent {
  render () {
    const {subtitles, currentIndex, mode, audioTime} = this.props;
    return (
      <div className='subtitles-pane'>
        {subtitles && subtitles.length > 0
          ? subtitles.map((st, index) => {
              const selected = currentIndex === index;
              if (mode !== 'editor') {
                const ref = selected && this._refSelected;
                return <SubtitlePaneItem key={index} item={st} ref={ref} selected={selected} mode={mode} onJump={this._jump}/>;
              }
              if (selected) {
                return <SubtitlePaneItemEditor key={index} item={st} ref={this._refSelected} offset={audioTime - st.start} audioTime={audioTime}
                  onChange={this._changeItem} onInsert={this._insertItem} onRemove={this._removeItem} onShift={this._shiftItem} />;
              }
              return <SubtitlePaneItemViewer key={index} item={st} onJump={this._jump} />;
            })
          : <p>{"No subtitles"}</p>}
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
}

class SubtitlesBand extends React.PureComponent {
  render () {
    const {active, item, offsetY, dataDrag: {isMoving}} = this.props;
    const translation = `translate(0px, ${this.state.currentY}px)`;
    return (
      <div className={classnames(['subtitles-band', `subtitles-band-${active?'':'in'}active`, isMoving && 'subtitles-band-moving', 'no-select'])}
        style={{transform: translation}}>
        <div className='subtitles-band-frame'>
          {item && <p className='subtitles-text'>{item.text}</p>}
        </div>
      </div>
    );
  }
  componentWillReceiveProps (nextProps) {
    if (nextProps.dataDrag.isMoving) {
      this.setState({
        currentY: this.state.lastPositionY + nextProps.dataDrag.moveDeltaY
      });
    } else {
      this.setState({
        lastPositionY: this.state.currentY
      });
    }
  }
  state = {currentY: 0, lastPositionY: 0};
}

const langOptions = [
  {label: 'fr-FR', value: 'fr-FR'},
  {label: 'en-US', value: 'en-US'}
];
function SubtitlesEditorSelector (state, props) {
  const {subtitlesSelected, subtitlesLoadFromText, subtitlesLoadFromUrl, subtitlesLoadFromFile, subtitlesCleared,
    subtitlesAddOption, subtitlesRemoveOption, subtitlesOptionSaved, subtitlesTextChanged} = state.get('scope');
  const {text: subtitlesText, selectedKey, availableOptions} = state.get('subtitles');
  const selected = selectedKey && availableOptions[selectedKey];
  return {availableOptions, selected, langOptions, subtitlesText,
    subtitlesSelected, subtitlesLoadFromText, subtitlesLoadFromUrl, subtitlesLoadFromFile,
    subtitlesCleared, subtitlesAddOption, subtitlesRemoveOption, subtitlesOptionSaved,
    subtitlesTextChanged};
}

class SubtitlesEditor extends React.PureComponent {
  render () {
    const {availableOptions, selected, subtitlesText, langOptions, onSelect, onRemove} = this.props;
    const availKeys = Object.keys(availableOptions).filter(key => !availableOptions[key].removed).sort();
    return (
      <div className='row'>
        <div className='col-sm-6' style={{paddingRight: '10px'}}>
          <h3>{"Subtitles options"}</h3>
          <div className='form-inline section'>
            <p>{"Select language: "}</p>
            <ul>
              {availKeys.map(key =>
                <SubtitlesEditorOption key={key} option={availableOptions[key]} selected={selected && selected.key === key}
                  onSelect={this._selectOption} onRemove={this._removeOption} />)}
            </ul>
            <Select options={langOptions} onChange={this._addSubtitleOption} clearableValue={false}
              placeholder='Add language…' />
          </div>
        </div>
        <div className='col-sm-6' style={{paddingLeft: '10px'}}>
          <h3>{"Subtitles buffer"}</h3>
          <div className='form-inline section'>
            <p>{"Load from:"}</p>
            {selected &&
              <Button onClick={this._loadEdited} disabled={typeof selected.text !== 'string'}>
                <i className='fa fa-arrow-right'/>{" stored "}{selected.key}
              </Button>}
            {selected &&
              <Button onClick={this._loadFromUrl} disabled={!selected.url}>
                <i className='fa fa-cloud-download'/>{" remote "}{selected.key}
              </Button>}
            <span>
              <input type='file' onChange={this._loadFromFile} accept='.srt' ref={this._refLoad} style={{display: 'none'}} />
              <Button onClick={this._openLoadInput}>
                <i className='fa fa-file-text-o'/>{" file"}
              </Button>
            </span>
            <Button onClick={this._clearSubtitles}>
              <i className='fa fa-eraser'/>{" empty"}
            </Button>
          </div>
          <div className='section'>
            <p>{"Loaded subtitles buffer:"}</p>
            <textarea rows={7} style={{width: '100%'}} value={subtitlesText} onChange={this._onChange}/>
            {selected &&
              <Button onClick={this._saveSubtitles}>
                <i className='fa fa-arrow-left'/>{" store into "}{selected.key}
              </Button>}
          </div>
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
  _clearSubtitles = (event) => {
    this.props.dispatch({type: this.props.subtitlesCleared});
  };
  _loadEdited = (event) => {
    const {selected: {key, text}} = this.props;
    this.props.dispatch({type: this.props.subtitlesLoadFromText, payload: {key, text}});
  };
  _loadFromUrl = (event) => {
    const {selected: {key, url}} = this.props;
    this.props.dispatch({type: this.props.subtitlesLoadFromUrl, payload: {key, url}});
  };
  _loadFromFile = (event) => {
    const {selected: {key}} = this.props;
    const file = event.target.files[0];
    event.target.value = '';
    this.props.dispatch({type: this.props.subtitlesLoadFromFile, payload: {key, file}});
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
  _saveSubtitles = (event) => {
    const {selected: {key}, subtitlesText: text} = this.props;
    this.props.dispatch({type: this.props.subtitlesOptionSaved, payload: {key, text}});
  };
}

class SubtitlesEditorOption extends React.PureComponent {
  render () {
    const {option, selected} = this.props;
    return (
      <li>
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

function initReducer (state) {
  return state.set('subtitles', {}).update('panes', panes => panes.set('subtitles',
    Immutable.Map({
      View: state.get('scope').SubtitlesPane,
      enabled: false,
      width: 200
    })));
}

function subtitlesModeSetReducer (state, {payload: {mode}}) {
  state = state.update('subtitles', subtitles => ({...subtitles, mode}));
  if (mode === 'editor') {
    /* The subtitles pane is always enabled in the editor. */
    state = state.setIn(['panes', 'subtitles', 'enabled'], true);
  }
  /* TODO: if mode is 'player', reload state from local storage settings? */
  return state;
}

function subtitlesPaneEnabledChangedReducer (state, {payload: {value}}) {
  return state.setIn(['panes', 'subtitles', 'enabled'], value);
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
      currentIndex: 0,
      loadedKey: false
    }));
}

function subtitlesClearedReducer (state, _action) {
  return state.update('subtitles', subtitles => (
    {...subtitles, text: '', items: [], currentIndex: 0, loadedKey: false}))
    .set('showSubtitlesBand', false);
}

function subtitlesLoadStartedReducer (state, {payload: {key}}) {
  return state.update('subtitles', subtitles => (
    {...subtitles, loading: key, lastError: false}));
}

function subtitlesLoadSucceededReducer (state, {payload: {key, text, items}}) {
  return state
    .update('subtitles', subtitles => (
      updateCurrentItem({...subtitles, loadedKey: key, loading: false, text, items})))
    .set('showSubtitlesBand', true);
}

function subtitlesLoadedSelector (state) {
  return state.get('subtitles').loadedKey;
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

function subtitlesOptionSavedReducer (state, {payload: {key, text}}) {
  return state.update('subtitles', subtitles => update(subtitles,
    {availableOptions: {[key]: {text: {$set: text}}}}));
}

function subtitlesLoadFailedReducer (state, {payload: {error}}) {
  let errorText = state.get('getMessage')("SUBTITLES_FAILED_TO_LOAD").s;
  if (error.res) {
    errorText = `${errorText} (${error.res.statusCode})`;
  }
  return state.update('subtitles', subtitles => (
    {...subtitles, loading: false, lastError: errorText, text: errorText}))
    .set('showSubtitlesBand', false);
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
        {start, end: split - 1, text}, {start: split, end, text: ""}]]}});
      jumpTo = split;
    }
    if (where === 'above') {
      subtitles = update(subtitles, {items: {$splice: [[index, 1,
        {start, end: split - 1, text: ""}, {start: split, end, text}]]}});
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
    return update(subtitles, {text: {$set: text}});
  });
}

function subtitlesSaveReducer (state, action) {
  return state.update('subtitles', function (subtitles) {
    return update(subtitles, {text: {$set: srtStringify(subtitles.items)}});
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
  if (!playerData) return false;
  return playerData.subtitles ? state.get('scope').SubtitlesMenu : false;
}

module.exports = function (bundle, deps) {

  bundle.use('getPlayerState', 'playerSeek');
  bundle.addReducer('init', initReducer);

  bundle.defineAction('subtitlesModeSet', 'Subtitles.Mode.Set');
  bundle.addReducer('subtitlesModeSet', subtitlesModeSetReducer);

  bundle.defineView('SubtitlesPane', SubtitlesPaneSelector, SubtitlesPane);
  bundle.defineAction('subtitlesPaneEnabledChanged', 'Subtitles.Pane.EnabledChanged');
  bundle.addReducer('subtitlesPaneEnabledChanged', subtitlesPaneEnabledChangedReducer);

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
  bundle.defineSelector('subtitlesLoadedSelector', subtitlesLoadedSelector);
  bundle.defineAction('subtitlesLoadFromFile', 'Subtitles.LoadFromFile');
  bundle.defineAction('subtitlesReload', 'Subtitles.Reload');

  bundle.defineAction('subtitlesSelected', 'Subtitles.Selected');
  bundle.addReducer('subtitlesSelected', subtitlesSelectedReducer);
  bundle.defineAction('subtitlesAddOption', 'Subtitles.AddOption');
  bundle.addReducer('subtitlesAddOption', subtitlesAddOptionReducer);
  bundle.defineAction('subtitlesRemoveOption', 'Subtitles.Option.Remove');
  bundle.addReducer('subtitlesRemoveOption', subtitlesRemoveOptionReducer);
  bundle.defineAction('subtitlesOptionSaved', 'Subtitles.Option.Saved');
  bundle.addReducer('subtitlesOptionSaved', subtitlesOptionSavedReducer);

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

  bundle.addSaga(subtitlesSaga);

  function SubtitlesMenuSelector (state, props) {
    const getMessage = state.get('getMessage');
    return {getMessage, Popup: deps.SubtitlesPopup};
  }

  function SubtitlesPopupSelector (state, props) {
    const {loadedKey, loading, lastError, availableOptions} = state.get('subtitles');
    const paneEnabled = state.getIn(['panes', 'subtitles', 'enabled']);
    const {subtitlesCleared, subtitlesLoadFromUrl, subtitlesPaneEnabledChanged} = deps;
    return {
      availableOptions, loadedKey, busy: !!loading, lastError,
      subtitlesCleared, subtitlesLoadFromUrl,
      paneEnabled, subtitlesPaneEnabledChanged,
    };
  }

  function SubtitlesPaneSelector (state, props) {
    const {subtitlesItemChanged, subtitlesItemInserted, subtitlesItemRemoved, subtitlesItemShifted} = state.get('scope');
    const {playerSeek} = deps;
    const {items, currentIndex, mode, audioTime} = state.get('subtitles');
    return {
      subtitlesItemChanged, subtitlesItemInserted, subtitlesItemRemoved, subtitlesItemShifted,
      subtitles: items, currentIndex, playerSeek, mode, audioTime};
  }

  function SubtitlesBandSelector (state, props) {
    const {items, currentIndex, itemVisible, isMoving, offsetY} = state.get('subtitles');
    if (!items) return {};
    return {
      active: itemVisible, item: items[currentIndex], isMoving, offsetY,
      beginMove: deps.subtitlesBandBeginMove,
      endMove: deps.subtitlesBandEndMove,
      doMove: deps.subtitlesBandMoved,
    };
  }

  function* subtitlesSaga () {
    yield takeLatest(deps.subtitlesLoadFromText, subtitlesLoadFromTextSaga);
    yield takeLatest(deps.subtitlesLoadFromUrl, subtitlesLoadFromUrlSaga);
    yield takeLatest(deps.subtitlesLoadFromFile, subtitlesLoadFromFileSaga);
    yield takeLatest(deps.subtitlesReload, subtitlesReloadSaga);
  }

  function* subtitlesLoadFromTextSaga ({payload: {key, text}}) {
    yield put({type: deps.subtitlesLoadStarted, payload: {key}});
    try {
      const items = srtParse(text);
      yield put({type: deps.subtitlesLoadSucceeded, payload: {key, text, items}});
    } catch (ex) {
      yield put({type: deps.subtitlesLoadFailed, payload: {error: ex}});
    }
  }

  function* subtitlesLoadFromUrlSaga ({payload: {key, url}}) {
    yield put({type: deps.subtitlesLoadStarted, payload: {key}});
    try {
      const text = yield call(getSubtitles, url);
      const items = srtParse(text);
      yield put({type: deps.subtitlesLoadSucceeded, payload: {key, text, items}});
    } catch (ex) {
      yield put({type: deps.subtitlesLoadFailed, payload: {error: ex}});
    }
  }

  function* subtitlesLoadFromFileSaga ({payload: {key, file}}) {
    try {
      const text = yield call(readFileAsText, file);
      const items = srtParse(text);
      yield put({type: deps.subtitlesLoadSucceeded, payload: {key, text, items}});
    } catch (ex) {
      yield put({type: deps.subtitlesLoadFailed, payload: {error: ex}});
    }
  }

  function* subtitlesReloadSaga (_action) {
    const {loadedKey: key, text} = yield select(state => state.get('subtitles'));
    const items = srtParse(text);
    yield put({type: deps.subtitlesLoadSucceeded, payload: {key, text, items}});
  }

};
