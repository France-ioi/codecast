/*
 *  Subtitles Editor
 */

import React from 'react';
import ReactDOM from 'react-dom';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';
import {Button, Callout, Icon, Intent, Menu, MenuItem, NonIdealState, Position, Spinner} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import {call, put, select, take, takeLatest} from 'redux-saga/effects';
import update from 'immutability-helper';
import Files from 'react-files';
import srtStringify from 'subtitle/lib/stringify';
import FileSaver from 'file-saver';

import {formatTimeLong, postJson, readFileAsText} from '../common/utils';
import {updateCurrentItem, getSubtitles} from './utils';

export default function (bundle) {

  bundle.defineAction('subtitlesSelected', 'Subtitles.Selected');

  /* subtitlesAddOption adds a subtitles option to loaded recording. */
  bundle.defineAction('subtitlesAddOption', 'Subtitles.AddOption');

  /* subtitlesRemoveOption removes a subtitles option from the loaded recording. */
  bundle.defineAction('subtitlesRemoveOption', 'Subtitles.Option.Remove');

  /* subtitlesSaveOptions {key} opens a Save file dialog to save the current
     text for the subtitles option with the given key. */
  bundle.defineAction('subtitlesSaveOption', 'Subtitles.Option.Save');

  /* subtitlesTextReverted {key, url} reloads subtitles from the cloud. */
  bundle.defineAction('subtitlesTextReverted', 'Subtitles.Text.Reverted');

  /* subtitlesTextLoaded {key, file} loads subtitles from a File. */
  bundle.defineAction('subtitlesTextLoaded', 'Subtitles.Text.Load');

  /* subtitlesTextChanged {text, unsaved} is dispatched when the text of the
     selected subtitles is changed.  If `unsaved` is a boolean the corresponding
     flag is set accordingly. */
  bundle.defineAction('subtitlesTextChanged', 'Subtitles.Text.Changed');

  /* subtitlesEditorEnter switches to the subtitles editor view (player
     view with added controls to edit subtitle items for the selected
     language) */
  bundle.defineAction('subtitlesEditorEnter', 'Subtitles.Editor.Enter');

  /* subtitlesEditorReturn switches back to the setup screen */
  bundle.defineAction('subtitlesEditorReturn', 'Subtitles.Editor.Return');

  /* These actions are self-explanatory. */
  bundle.defineAction('subtitlesItemChanged', 'Subtitles.Item.Changed');
  bundle.defineAction('subtitlesItemInserted', 'Subtitles.Item.Inserted');
  bundle.defineAction('subtitlesItemRemoved', 'Subtitles.Item.Removed');
  bundle.defineAction('subtitlesItemShifted', 'Subtitles.Item.Shifted');

  /* subtitlesEditorSave is dispatched when the user clicks the 'Save' button
     on the setup screen. */
  bundle.defineAction('subtitlesEditorSave', 'Subtitles.Editor.Save');
  bundle.defineAction('subtitlesEditorSaveFailed', 'Subtitles.Editor.Save.Failed');
  bundle.defineAction('subtitlesEditorSaveSucceeded', 'Subtitles.Editor.Save.Succeeded');

  /* subtitlesSave is dispatched when returning from the editor to the screen. */
  bundle.defineAction('subtitlesSave', 'Subtitles.Save');

  bundle.addReducer('subtitlesSelected', subtitlesSelectedReducer);
  bundle.addReducer('subtitlesAddOption', subtitlesAddOptionReducer);
  bundle.addReducer('subtitlesRemoveOption', subtitlesRemoveOptionReducer);
  bundle.addReducer('subtitlesTextChanged', subtitlesTextChangedReducer);
  bundle.addReducer('subtitlesItemChanged', subtitlesItemChangedReducer);
  bundle.addReducer('subtitlesItemInserted', subtitlesItemInsertedReducer);
  bundle.addReducer('subtitlesItemRemoved', subtitlesItemRemovedReducer);
  bundle.addReducer('subtitlesItemShifted', subtitlesItemShiftedReducer);
  bundle.addReducer('subtitlesSave', subtitlesSaveReducer);
  bundle.addReducer('subtitlesEditorSave', subtitlesEditorSaveReducer);
  bundle.addReducer('subtitlesEditorSaveFailed', subtitlesEditorSaveFailedReducer);
  bundle.addReducer('subtitlesEditorSaveSucceeded', subtitlesEditorSaveSucceededReducer);

  bundle.addSaga(subtitlesEditorSaga);

  bundle.defineView('SubtitlesEditor', SubtitlesEditorSelector, SubtitlesEditor);
  bundle.defineView('SubtitlesEditorReturn', SubtitlesEditorReturnSelector, SubtitlesEditorReturn);
  bundle.defineView('SubtitlesEditorPane', SubtitlesEditorPaneSelector, SubtitlesEditorPane);

}

function clearNotify (subtitles) {
  return {...subtitles, notify: {}};
}

function setUnsaved (subtitles) {
  return {...subtitles, unsaved: true};
}

function subtitlesSelectedReducer (state, {payload: {option}}) {
  return state.update('subtitles', subtitles => clearNotify({...subtitles, selectedKey: option.key}));
}

function subtitlesAddOptionReducer (state, {payload: {key, select}}) {
  return state.update('subtitles', function (subtitles) {
    const option = subtitles.availableOptions[key];
    if (!option) {
      const base = subtitles.langOptions.find(option => option.value === key);
      subtitles = update(subtitles, {availableOptions: {[key]: {$set: {key, text: '', unsaved: true, ...base}}}});
    } else if (option.removed) {
      subtitles = update(subtitles, {availableOptions: {[key]: {removed: {$set: false}}}});
    }
    if (select && subtitles.availableOptions[key]) {
      subtitles = update(subtitles, {selectedKey: {$set: key}});
    }
    return setUnsaved(clearNotify(subtitles));
  });
}

function subtitlesRemoveOptionReducer (state, {payload: {key}}) {
  return state.update('subtitles', function (subtitles) {
    const changes = {availableOptions: {[key]: {removed: {$set: true}}}};
    if (subtitles.selectedKey === key) {
      changes.selectedKey = {$set: null};
    }
    return setUnsaved(clearNotify(update(subtitles, changes)));
  });
}


function subtitlesTextChangedReducer (state, {payload: {text, unsaved}}) {
  const changes = {text: {$set: text}};
  if (typeof unsaved === 'boolean') {
    changes.unsaved = {$set: unsaved}
  }
  return state.update('subtitles', function (subtitles) {
    const {selectedKey: key} = subtitles;
    return setUnsaved(clearNotify(update(subtitles, {availableOptions: {[key]: changes}})));
  });
}

function subtitlesItemChangedReducer (state, {payload: {index, text}}) {
  return state.update('subtitles', function (subtitles) {
    return update(subtitles, {items: {[index]: {text: {$set: text}}}});
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
    subtitles = update(subtitles, {items: {$splice: [[firstIndex, 2, {start, end, text}]]}});
    const audioTime = state.getIn(['player', 'audioTime']);
    return updateCurrentItem(subtitles, audioTime);
  });
}

function subtitlesItemShiftedReducer (state, {payload: {index, amount}}) {
  return state.update('subtitles', function (subtitles) {
    if (index === 0) return subtitles;
    function shift (ms) { return ms + amount; }
    /* The current item is not updated, otherwise its start could move
       backwards past audioTime, causing the item not to remain current,
       and disturbing further user action on the same item. */
    return update(subtitles, {items: {
      [index-1]: {end: {$apply: shift}},
      [index]: {start: {$apply: shift}}
    }});
  });
}

function subtitlesSaveReducer (state, action) {
  return state.update('subtitles', function (subtitles) {
    const {selectedKey: key, availableOptions, items} = subtitles;
    const text = srtStringify(items)
    return clearNotify(update(subtitles, {availableOptions: {[key]: {text: {$set: text}}}}));
  });
}

function subtitlesEditorSaveReducer (state, action) {
  return state.update('subtitles', subtitles => ({...subtitles, notify: {key: 'pending'}}));
}

function subtitlesEditorSaveFailedReducer (state, {payload: {error}}) {
  return state.update('subtitles', subtitles => ({...subtitles, notify: {key: 'failure', message: error.toString()}}));
}

function subtitlesEditorSaveSucceededReducer (state, action) {
  return state.update('subtitles', subtitles =>
    update(subtitles, {
      unsaved: {$set: false},
      notify: {$set: {key: 'success'}},
      availableOptions: {$apply: clearAllUnsaved}
    }));
}

function clearAllUnsaved (options) {
  const changes = {};
  for (let key of Object.keys(options)) {
    changes[key] = {unsaved: {$set: false}};
  }
  return update(options, changes);
}

function* subtitlesEditorSaga (app) {
  const {actionTypes} = app;
  yield takeLatest(actionTypes.subtitlesSelected, subtitlesSelectedSaga, app);
  yield takeLatest(actionTypes.subtitlesEditorEnter, subtitlesEditorEnterSaga, app);
  yield takeLatest(actionTypes.subtitlesEditorSave, subtitlesEditorSaveSaga, app);
  yield takeLatest(actionTypes.subtitlesEditorReturn, subtitlesEditorReturnSaga, app);
  yield takeLatest(actionTypes.subtitlesTextReverted, subtitlesTextRevertedSaga, app);
  yield takeLatest(actionTypes.subtitlesTextLoaded, subtitlesTextLoadedSaga, app);
  yield takeLatest(actionTypes.subtitlesSaveOption, subtitlesSaveOptionSaga, app);
}

function* subtitlesSelectedSaga ({actionTypes}, {payload: {option}}) {
  /* Trigger loading of subtitles when first selected. */
  const {key, url, text} = option;
  if (url && !text) {
    yield put({type: actionTypes.subtitlesTextReverted, payload: {key, url}});
  }
}

function* subtitlesEditorEnterSaga ({actionTypes, views}, _action) {
  yield put({type: actionTypes.subtitlesEditingChanged, payload: {editing: true}});
  yield put({type: actionTypes.editorControlsChanged, payload: {controls: {top: [views.PlayerControls], floating: [views.SubtitlesEditorReturn]}}});
  yield put({type: actionTypes.subtitlesReload});
  yield put({type: actionTypes.switchToScreen, payload: {screen: 'edit'}});
}

function* subtitlesEditorReturnSaga ({actionTypes}, _action) {
  yield put({type: actionTypes.subtitlesSave});
  yield put({type: actionTypes.subtitlesEditingChanged, payload: {editing: false}});
  yield put({type: actionTypes.editorControlsChanged, payload: {controls: {floating: []}}});
  yield put({type: actionTypes.switchToScreen, payload: {screen: 'setup'}});
}

function* subtitlesEditorSaveSaga ({actionTypes}, _action) {
  const {baseUrl, base, subtitles} = yield select(function (state) {
    const {baseUrl} = state.get('options');
    const editor = state.get('editor');
    const base = editor.get('base');
    const subtitles = Object.values(state.get('subtitles').availableOptions);
    return {baseUrl, base, subtitles};
  });
  const changes = {subtitles};
  let result;
  try {
    // TODO: also pass new base when copying
    result = yield call(postJson, `${baseUrl}/save`, {base, changes});
  } catch (ex) {
    result = {error: ex.toString()};
  }
  if (result.error) {
    yield put({type: actionTypes.subtitlesEditorSaveFailed, payload: {error: result.error}});
    return;
  }
  const timestamp = new Date();
  yield put({type: actionTypes.subtitlesEditorSaveSucceeded, payload: {timestamp}});
}

function* subtitlesTextRevertedSaga ({actionTypes}, {payload: {key, url}}) {
  const text = yield call(getSubtitles, url);
  /* Text is loaded from server, so clear the unsaved flag. */
  yield put({type: actionTypes.subtitlesTextChanged, payload: {text, unsaved: false}});
}

function* subtitlesTextLoadedSaga ({actionTypes}, {payload: {key, file}}) {
  yield put({type: actionTypes.subtitlesLoadFromFile, payload: {key, file}});
  while (true) {
    const loadAction = yield take([actionTypes.subtitlesLoadSucceeded, actionTypes.subtitlesLoadFailed]);
    if (loadAction.payload.key !== key) {
      continue;
    }
    if (loadAction.type === actionTypes.subtitlesLoadSucceeded) {
      const {text} = loadAction.payload;
      yield put({type: actionTypes.subtitlesTextChanged, payload: {text, unsaved: true}});
    }
    break;
  }
}

function* subtitlesSaveOptionSaga (_app, {payload: {key}}) {
  const {text} = yield select(state => state.get('subtitles').availableOptions[key]);
  const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
  yield call(FileSaver.saveAs, blob, `${key}.srt`);
}

function SubtitlesEditorSelector (state, props) {
  const actionTypes = state.get('actionTypes');
  const {unsaved, notify, selectedKey, availableOptions, langOptions} = state.get('subtitles');
  const canSave = state.getIn(['editor', 'canSave']);
  const selected = selectedKey && availableOptions[selectedKey];
  const subtitlesText = (selected && selected.text) || '';
  return {actionTypes, canSave, unsaved, notify, availableOptions, langOptions, selected, subtitlesText};
}

class SubtitlesEditor extends React.PureComponent {
  render () {
    const {availableOptions, selected, subtitlesText, langOptions, onSelect, onRemove, canSave, unsaved, notify} = this.props;
    const availKeys = Object.keys(availableOptions).filter(key => !availableOptions[key].removed).sort();
    return (
      <div>
        <div className='hbox mb'>
          <div className='fill' style={{paddingRight: '10px'}}>
            <Menu>
              {availKeys.map(key =>
                <SubtitlesEditorOption key={key} option={availableOptions[key]}
                  selected={selected && selected.key === key}
                  onSelect={this._selectOption} />)}
              <MenuItem icon='add' text='Add language…' popoverProps={{position: Position.TOP_RIGHT}}>
                {langOptions.map(option =>
                  <SubtitlesEditorNewOption key={option.value} option={option}
                    disabled={availKeys.find(key => option.value === key)}
                    onSelect={this._addOption} />)}
              </MenuItem>
            </Menu>
          </div>
          <div className='fill' style={{paddingLeft: '10px'}}>
            {selected
              ? <div>
                  <textarea rows={7} style={{width: '100%'}} value={subtitlesText} onChange={this._onChange}/>
                  <div className='buttons-bar'>
                    <Files  onChange={this._fileChanged} accepts={this._fileAccepts} style={{display: 'inline-block'}}><Button icon={IconNames.UPLOAD}>{"Load"}</Button></Files>
                    <Button onClick={this._saveSelected} icon={IconNames.DOWNLOAD} text={"Save"}/>
                    <Button onClick={this._reloadSelected} icon={IconNames.CLOUD_DOWNLOAD} disabled={!selected.url} text={"Revert"}/>
                    <Button onClick={this._removeSelected} icon={IconNames.CROSS} text={'Remove'}/>
                  </div>
                </div>
              : <NonIdealState visual='arrow-left' title={"No language selected"} description={"Load existing subtitles or add a new language, and the click the Edit button."} />}
          </div>
        </div>
        <div className='hbox mb' style={{textAlign: 'center', backgroundColor: '#efefef', padding: '10px'}}>
          <div className='fill center'>
            <Button onClick={this._beginEdit} disabled={!selected} icon={IconNames.EDIT} text={"Edit"} style={{marginRight: '10px'}}/>
            <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"} disabled={!canSave} intent={unsaved ? Intent.PRIMARY : Intent.NONE}/>
          </div>
        </div>
        {!canSave &&
          <Callout intent={Intent.WARNING} title={"Insufficient access rights"}>
            {"The current user is not allowed to modify this Codecast."}
          </Callout>}
        <div>
          {notify.key === 'pending' && <Callout icon={<Spinner small/>}>{"Saving, please wait."}</Callout>}
          {notify.key === 'success' && <Callout icon='saved' intent={Intent.SUCCESS}>{"Saved."}</Callout>}
          {notify.key === 'failure' && <Callout icon='warning-sign' intent={Intent.DANGER}>{"Failed to save: "}{notify.message}</Callout>}
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
    this.props.dispatch({type: this.props.actionTypes.subtitlesSelected, payload: {option}});
  };
  _addOption = (option) => {
    const key = option.value;
    this.props.dispatch({type: this.props.actionTypes.subtitlesAddOption, payload: {key, select: true}});
  };
  _reloadSelected = () => {
    const {selected: {key, url}} = this.props;
    this.props.dispatch({type: this.props.actionTypes.subtitlesTextReverted, payload: {key, url}});
  };
  _saveSelected = () => {
    const {selected: {key}} = this.props;
    this.props.dispatch({type: this.props.actionTypes.subtitlesSaveOption, payload: {key}});
  };
  _removeSelected = () => {
    const {selected: {key}} = this.props;
    if (confirm(`Confirm remove of language ${key}?`)) {
      this.props.dispatch({type: this.props.actionTypes.subtitlesRemoveOption, payload: {key}});
    }
  };
  _onChange = (event) => {
    const text = event.target.value;
    this.props.dispatch({type: this.props.actionTypes.subtitlesTextChanged, payload: {text, unsaved: true}});
  };
  _beginEdit = (event) => {
    this.props.dispatch({type: this.props.actionTypes.subtitlesEditorEnter});
  };
  _save = (event) => {
    this.props.dispatch({type: this.props.actionTypes.subtitlesEditorSave});
  };
  _fileAccepts = ['.srt'];
  _fileChanged = ([file]) => {
    const key = this.props.selected.key;
    this.props.dispatch({type: this.props.actionTypes.subtitlesTextLoaded, payload: {key, file}});
  };
}

class SubtitlesEditorOption extends React.PureComponent {
  render () {
    const {option, selected} = this.props;
    const text = <span>{option.label}</span>;
    const icon = option.unsaved ? 'floppy-disk' : 'blank';
    const intent = selected ? Intent.PRIMARY : Intent.NONE;
    return (
      <MenuItem icon={icon} text={text} active={selected} intent={intent} onClick={this._select} />
    );
  }
  _select = (event) => {
    this.props.onSelect(this.props.option);
  };
}

class SubtitlesEditorNewOption extends React.PureComponent {
  render () {
    const {option, disabled} = this.props;
    const text = <span>{option.label}</span>;
    return <MenuItem text={text} disabled={disabled} onClick={this._add} />;
  }
  _add = (event) => {
    this.props.onSelect(this.props.option);
  };
}

function SubtitlesEditorReturnSelector (state) {
  const {subtitlesEditorReturn} = state.get('actionTypes');
  return {subtitlesEditorReturn};
}

class SubtitlesEditorReturn extends React.PureComponent {
  render () {
    return <Button onClick={this._return}><i className='fa fa-reply'/></Button>;
  }
  _return = () => {
    this.props.dispatch({type: this.props.subtitlesEditorReturn});
  };
}

function SubtitlesEditorPaneSelector (state, props) {
  const getMessage = state.get('getMessage');
  const {subtitlesItemChanged, subtitlesItemInserted, subtitlesItemRemoved,
    subtitlesItemShifted, subtitlesFilterTextChanged, playerSeek} = state.get('actionTypes');
  const {items, currentIndex, audioTime} = state.get('subtitles');
  return {
    subtitlesItemChanged, subtitlesItemInserted, subtitlesItemRemoved,
    subtitlesItemShifted, playerSeek, getMessage,
    subtitles: items, currentIndex, audioTime};
}

class SubtitlesEditorPane extends React.PureComponent {
  render () {
    const {subtitles, currentIndex, editing, audioTime, filterText, filterRegexp, getMessage} = this.props;
    const items = [], message = false;
    const shiftAmount = 200;
    if (subtitles && subtitles.length > 0) {
      let prevStart = 0;
      const canRemove = subtitles.length > 1;
      subtitles.forEach((st, index) => {
        const selected = currentIndex === index;
        if (selected) {
          items.push(<SubtitlePaneItemEditor key={index} item={st} ref={this._refSelected} offset={audioTime - st.start} audioTime={audioTime}
            onChange={this._changeItem}
            onInsert={this._insertItem}
            onRemove={canRemove && this._removeItem}
            onShift={this._shiftItem}
            minStart={prevStart + shiftAmount} maxStart={st.end - shiftAmount} shiftAmount={shiftAmount} />);
        } else {
          items.push(<SubtitlePaneItemViewer key={index} item={st} onJump={this._jump} />);
        }
        prevStart = st.start;
      });
    } else {
      message = <p>{getMessage('CLOSED_CAPTIONS_NOT_LOADED')}</p>;
    }
    return (
      <div className='subtitles-pane'>
        {items}
        {message}
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
    this.props.dispatch({type: this.props.playerSeek, payload: {audioTime: subtitle.start}});
  };
  _changeItem = (item, text) => {
    const index = this.props.subtitles.indexOf(item);
    this.props.dispatch({type: this.props.subtitlesItemChanged, payload: {index, text}});
  };
  _insertItem = (item, offset, where) => {
    const index = this.props.subtitles.indexOf(item);
    this.props.dispatch({type: this.props.subtitlesItemInserted, payload: {index, offset, where}});
  };
  _removeItem = (item) => {
    const index = this.props.subtitles.indexOf(item);
    const merge = index === 0 ? 'down' : 'up';
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

/* SubtitlePaneItemEditor is used in the *editor* to show the selected, editable item in the subtitles pane. */
class SubtitlePaneItemEditor extends React.PureComponent {
  render() {
    const {item: {text, start, end}, offset, audioTime, minStart, maxStart} = this.props;
    return (
      <div className='subtitles-item-editor'>
        <div className='subtitles-timestamp row'>
          <div className='col-sm-6'>
            <span className='pull-left'>
              <Button small disabled={start <= minStart} onClick={this._onShiftMinus} icon={IconNames.CHEVRON_LEFT}/>
            </span>
            <span className='subtitles-timestamp-start'>{formatTimeLong(start)}</span>
            <span className='pull-right'>
              <Button small disabled={start === 0 || start >= maxStart} onClick={this._onShiftPlus} icon={IconNames.CHEVRON_RIGHT}/>
            </span>
          </div>
          <div className='col-sm-6'>
            <span className='subtitles-timestamp-end'>{formatTimeLong(end)}</span>
            <span className='pull-right'>
              <Button small disabled={!this.props.onRemove} onClick={this._onRemove} icon={IconNames.MINUS}/>
            </span>
          </div>
        </div>
        <textarea ref={this.refTextarea} className='subtitles-text' value={text} onChange={this._onChange} rows='6'/>
        <div className='subtitles-split row'>
          <p>{formatTimeLong(audioTime)}</p>
          <span className='pull-right'>
            <Button small disabled={offset === 0 || audioTime < start} onClick={this._onInsertBelow} icon={IconNames.PLUS}/>
          </span>
        </div>
      </div>
    );
  }
  componentDidMount () {
    this._textarea.focus();
  }
  refTextarea = (element) => {
    this._textarea = element;
  };
  _onChange = (event) => {
    this.props.onChange(this.props.item, event.target.value);
  };
  _onInsertBelow = (event) => {
    const {item, offset} = this.props;
    this.props.onInsert(item, offset, 'below');
  };
  _onRemove = (event) => {
    this.props.onRemove(this.props.item);
  };
  _onShiftMinus = (event) => {
    this.props.onShift(this.props.item, -this.props.shiftAmount);
  };
  _onShiftPlus = (event) => {
    this.props.onShift(this.props.item, this.props.shiftAmount);
  };
}
