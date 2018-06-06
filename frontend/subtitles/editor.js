/*
 *  Subtitles Editor
 */

import React from 'react';
import ReactDOM from 'react-dom';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';
import {Button, Icon, Intent, Menu, MenuItem, NonIdealState, Position} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import {takeLatest, put, call, select} from 'redux-saga/effects';
import update from 'immutability-helper';
//import FileInput from 'react-file-input';
import srtStringify from 'subtitle/lib/stringify';

import {formatTimeLong} from '../common/utils';
import FlagIcon from '../common/flag_icon';
import {updateCurrentItem, getSubtitles} from './utils';

export default function (bundle) {

  bundle.defineAction('subtitlesSelected', 'Subtitles.Selected');

  /* subtitlesAddOption adds a subtitles option to loaded recording. */
  bundle.defineAction('subtitlesAddOption', 'Subtitles.AddOption');

  /* subtitlesRemoveOption removes a subtitles option from the loaded recording. */
  bundle.defineAction('subtitlesRemoveOption', 'Subtitles.Option.Remove');

  /* subtitlesTextChanged is dispatched when the user directly edits the
     selected subtitles text. */
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

function subtitlesSelectedReducer (state, {payload: {option}}) {
  return state.update('subtitles', subtitles => ({...subtitles, selectedKey: option.key}));
}

function subtitlesAddOptionReducer (state, {payload: {key, select}}) {
  return state.update('subtitles', function (subtitles) {
    const option = subtitles.availableOptions[key];
    if (!option || option.removed) {
      const base = subtitles.langOptions.find(option => option.value === key);
      subtitles = update(subtitles, {availableOptions: {[key]: {$set: {key, text: '', ...base}}}});
      if (select) {
        subtitles = update(subtitles, {selectedKey: {$set: key}});
      }
    }
    return subtitles;
  });
}

function subtitlesRemoveOptionReducer (state, {payload: {key}}) {
  return state.update('subtitles', function (subtitles) {
    return update(subtitles, {availableOptions: {[key]: {removed: {$set: true}}}});
  });
}


function subtitlesTextChangedReducer (state, {payload: {text}}) {
  return state.update('subtitles', function (subtitles) {
    const {selectedKey: key} = subtitles;
    return update(subtitles, {availableOptions: {[key]: {text: {$set: text}}}});
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
    return update(subtitles, {availableOptions: {[key]: {text: {$set: text}}}});
  });
}

function subtitlesEditorSaveReducer (state, action) {
  return state.update('subtitles', subtitles => ({...subtitles, notify: 'pending'}));
}

function subtitlesEditorSaveFailedReducer (state, action) {
  return state.update('subtitles', subtitles => ({...subtitles, notify: {key: 'failure', message: error.toString()}}));
}

function subtitlesEditorSaveSucceededReducer (state, {payload: {error}}) {
  return state.update('subtitles', subtitles => ({...subtitles, notify: {key: 'success'}}));
}

function* subtitlesEditorSaga () {
  const scope = yield select(state => state.get('scope'));
  yield takeLatest(scope.subtitlesSelected, subtitlesSelectedSaga);
  yield takeLatest(scope.subtitlesEditorEnter, subtitlesEditorEnterSaga);
  yield takeLatest(scope.subtitlesEditorSave, subtitlesEditorSaveSaga);
  yield takeLatest(scope.subtitlesEditorReturn, subtitlesEditorReturnSaga);
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

function* subtitlesEditorEnterSaga (_action) {
  const {subtitlesEditingChanged, editorControlsChanged, PlayerControls, SubtitlesEditorReturn, subtitlesReload, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: subtitlesEditingChanged, payload: {editing: true}});
  yield put({type: editorControlsChanged, payload: {controls: {top: [PlayerControls], floating: [SubtitlesEditorReturn]}}});
  yield put({type: subtitlesReload});
  yield put({type: switchToScreen, payload: {screen: 'edit'}});
}

function* subtitlesEditorReturnSaga (_action) {
  const {subtitlesSave, subtitlesEditingChanged, editorControlsChanged, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: subtitlesSave});
  yield put({type: subtitlesEditingChanged, payload: {editing: false}});
  yield put({type: editorControlsChanged, payload: {controls: {floating: []}}});
  yield put({type: switchToScreen, payload: {screen: 'setup'}});
}

function* subtitlesEditorSaveSaga (_action) {
  /* XXX valid for subtitles, code for trimming is completely different,
         so move to subtitles bundle */
  const {baseUrl, base, data, subtitlesEditorSaveFailed, subtitlesEditorSaveSucceeded} = yield select(function (state) {
    const {subtitlesEditorSaveFailed, subtitlesEditorSaveSucceeded} = state.get('scope');
    const {baseUrl} = state.get('options');
    const editor = state.get('editor');
    const base = editor.get('base');
    const data = editor.get('data');
    const subtitles = Object.values(state.get('subtitles').availableOptions);
    return {
      baseUrl, base, data: {...data, subtitles},
      subtitlesEditorSaveFailed, subtitlesEditorSaveSucceeded
    };
  });
  try {
    const result = yield call(postJson, `${baseUrl}/save`, {base, data});
    // TODO: pass new base as payload, when copying
    const timestamp = new Date();
    yield put({type: subtitlesEditorSaveSucceeded, payload: {timestamp}});
  } catch (ex) {
    console.log('error', ex);
    yield put({type: subtitlesEditorSaveFailed, payload: {error: ex.toString()}});
  }
}

function SubtitlesEditorSelector (state, props) {
  const {subtitlesSelected, subtitlesAddOption, subtitlesRemoveOption,
    subtitlesTextChanged, subtitlesEditorEnter, subtitlesEditorSave} = state.get('scope');
  const {notify, selectedKey, availableOptions, langOptions} = state.get('subtitles');
  const selected = selectedKey && availableOptions[selectedKey];
  const subtitlesText = selected && selected.text;
  return {availableOptions, selected, langOptions, subtitlesText,
    subtitlesSelected, subtitlesAddOption, subtitlesRemoveOption,
    subtitlesTextChanged, subtitlesEditorEnter, subtitlesEditorSave, notify};
}

class SubtitlesEditor extends React.PureComponent {
  render () {
    const {availableOptions, selected, subtitlesText, langOptions, onSelect, onRemove, notify} = this.props;
    const availKeys = Object.keys(availableOptions).filter(key => !availableOptions[key].removed).sort();
    return (
      <div>
        <div className='row'>
          <div className='col-sm-6' style={{paddingRight: '10px'}}>
            <Menu>
              {availKeys.map(key =>
                <SubtitlesEditorOption key={key} option={availableOptions[key]}
                  selected={selected && selected.key === key}
                  onSelect={this._selectOption} onRemove={this._removeOption} />)}
              <MenuItem icon='add' text='Add language…' popoverProps={{position: Position.TOP_RIGHT}}>
                {langOptions.map(option =>
                  <SubtitlesEditorNewOption key={option.value} option={option}
                    disabled={availKeys.find(key => option.value === key)}
                    onSelect={this._addOption} />)}
              </MenuItem>
            </Menu>
          </div>
          <div className='col-sm-6' style={{paddingLeft: '10px'}}>
            {selected
              ? <textarea rows={7} style={{width: '100%'}} value={subtitlesText} onChange={this._onChange} />
              : <NonIdealState visual='arrow-left' title={"No language selected"} description={"Load existing subtitles or add a new language, and the click the Edit button."} />}
          </div>
        </div>
        <div style={{marginTop: '2em', textAlign: 'center', backgroundColor: '#efefef', padding: '10px'}}>
          <span style={{marginRight: '10px'}}>
            <Button onClick={this._beginEdit} disabled={!selected} icon={IconNames.EDIT} text={"Edit"}/>
          </span>
          <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"}/>
          {/* TODO: clean up the spinner */}
          {notify.key === 'pending' && <i className='fa fa-spinner fa-spin'/>}
          {notify.key === 'success' && <Icon icon='saved' intent={Intent.SUCCESS} />}
          {notify.key === 'failure' && <Icon icon='warning-sign' Intent={Intent.DANGER}/>}
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
  _addOption = (option) => {
    const key = option.value;
    this.props.dispatch({type: this.props.subtitlesAddOption, payload: {key, select: true}});
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
    this.props.dispatch({type: this.props.subtitlesEditorEnter});
  };
  _save = (event) => {
    this.props.dispatch({type: this.props.subtitlesEditorSave});
  };
}

class SubtitlesEditorOption extends React.PureComponent {
  render () {
    const {option, selected} = this.props;
    const text = <span>{<FlagIcon code={option.countryCode}/>}{' '}{option.label}</span>;
    const icon = typeof option.text === 'string' ? 'floppy-disk' : 'blank';
    const intent = selected ? Intent.PRIMARY : Intent.NONE;
    return (
      <MenuItem icon={icon} text={text} active={selected} intent={intent} popoverProps={{position: Position.TOP_RIGHT}}>
        <MenuItem icon={IconNames.EDIT} text={'Load'} onClick={this._select} />
        <MenuItem icon={IconNames.CROSS} text={'Remove'} onClick={this._remove} />
      </MenuItem>
    );
  }
  _select = (event) => {
    this.props.onSelect(this.props.option);
  };
  _remove = (event) => {
    this.props.onRemove(this.props.option);
  };
}

class SubtitlesEditorNewOption extends React.PureComponent {
  render () {
    const {option, disabled} = this.props;
    const text = <span>{<FlagIcon code={option.countryCode}/>}{' '}{option.label}</span>;
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
    subtitlesItemShifted, subtitlesFilterTextChanged, playerSeek} = state.get('scope');  const {items, currentIndex, audioTime} = state.get('subtitles');
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
