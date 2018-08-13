import Immutable from 'immutable';
import React from 'react';
import classnames from 'classnames';
import {eventChannel} from 'redux-saga'
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import {AnchorButton, Button, Callout, ControlGroup, Icon, InputGroup, Intent, Label, ProgressBar, Spinner, Tab, Tabs} from '@blueprintjs/core';
import {IconNames} from '@blueprintjs/icons';
import FileSaver from 'file-saver';

import {postJson, formatTime} from '../common/utils';
import {extractWaveform} from './waveform/tools';
import FullWaveform from './waveform/full';

export default function (bundle, deps) {

  bundle.addReducer('init', initReducer);
  bundle.addReducer('editorPrepare', initReducer);

  bundle.defineAction('editorPropertyChanged', 'Editor.Property.Changed');
  bundle.addReducer('editorPropertyChanged', editorPropertyChangedReducer);

  bundle.defineAction('editorSaveAudio', 'Editor.Audio.Save');

  bundle.defineAction('editorSave', 'Editor.Save');
  bundle.defineAction('editorSaveFailed', 'Editor.Save.Failed');
  bundle.defineAction('editorSaveSucceeded', 'Editor.Save.Succeeded');

  bundle.addReducer('editorSave', editorSaveReducer);
  bundle.addReducer('editorSaveFailed', editorSaveFailedReducer);
  bundle.addReducer('editorSaveSucceeded', editorSaveSucceededReducer);

  bundle.defineView('EditorOverview', EditorOverviewSelector, EditorOverview);

  bundle.addSaga(function* editorOverviewSaga (app) {
    yield takeLatest(app.actionTypes.editorSaveAudio, editorSaveAudioSaga, app);
    yield takeLatest(app.actionTypes.editorSave, editorSaveSaga, app);
  });;

}

function initReducer (state) {
  return state.update('editor', editor => editor
    .set('save', {state: 'idle'})
    .set('unsaved', false));
}

function editorPropertyChangedReducer (state, {payload: {key, value}}) {
  return state.update('editor', editor =>
    editor.get('save').state === 'pending'
      ? editor
      : editor
          .update('data', data => ({...data, [key]: value}))
          .set('save', {state: 'idle'})
          .set('unsaved', true));
}

function EditorOverviewSelector (state, props) {
  const actionTypes = state.get('actionTypes');
  const editor = state.get('editor');
  const playerUrl = editor.get('playerUrl');
  const {version, name, events} = editor.get('data');
  const canSave = editor.get('canSave');
  const unsaved = editor.get('unsaved');
  const save = editor.get('save');
  const duration = editor.get('duration');
  const waveform = editor.get('waveform');
  return {actionTypes, version, name, events, duration, waveform, canSave, unsaved, save, playerUrl};
}

class EditorOverview extends React.PureComponent {
  render () {
    const {version, name, events, duration, waveform, unsaved, save, playerUrl, canSave} = this.props;
    return (
      <div className='vbox'>
        <Label text={"Name"}>
          <input type='text' placeholder="Name" className='bp3-input bp3-fill' value={name||''} onChange={this._nameChanged} />
        </Label>
        <Label text={"Player URL"}>
          <InputGroup leftIcon={IconNames.LINK} type='text' value={playerUrl} readOnly
            rightElement={<AnchorButton href={playerUrl} icon={IconNames.PLAY} minimal target='_blank'/>} />
        </Label>
        {/* list of available subtitles? */}
        <div>
          <FullWaveform width={760} height={80} duration={duration} waveform={waveform} events={events} />
          <div className='hbox mb'>
            <div className='fill'>{"Version "}<b>{version}</b></div>
            <div className='fill'>{"Duration "}<b>{formatTime(duration)}</b></div>
            <div className='fill'>{"Number of events "}<b>{events.length}</b></div>
          </div>
        </div>
        <div className='hbox mb' style={{textAlign: 'center', backgroundColor: '#efefef', padding: '10px'}}>
          <div className='fill center'>
            <Button onClick={this._saveAudio} icon={IconNames.DOWNLOAD} text={"Save audio"}/>
            <Button onClick={this._save} icon={IconNames.CLOUD_UPLOAD} text={"Save"} disabled={!canSave} />
          </div>
        </div>
        {!canSave &&
          <Callout intent={Intent.WARNING} title={"Insufficient access rights"}>
            {"The current user is not allowed to modify this Codecast."}
          </Callout>}
        {save &&
          <div className='vbox'>
            {save.state === 'pending' &&
              <div className='fill'>
                <Spinner small/>
                {"Saving, please wait…"}
              </div>}
            {save.state === 'failure' &&
              <div className='fill'>
                <Icon icon='cross' intent={Intent.DANGER} />
                {"Failed to save: "}{save.error}
              </div>}
            {save.state === 'success' &&
              <div className='fill'>
                <Icon icon='tick' intent={Intent.SUCCESS} />
                {"Saved."}
              </div>}
            </div>}
      </div>
    );
  }
  _saveAudio = () => {
    const {dispatch, actionTypes} = this.props;
    dispatch({type: actionTypes.editorSaveAudio});
  };
  _nameChanged = (event) => {
    const {dispatch, actionTypes} = this.props;
    const value = event.target.value;
    dispatch({type: actionTypes.editorPropertyChanged, payload: {key: 'name', value: value}});
  };
  _save = () => {
    const {dispatch, actionTypes} = this.props;
    dispatch({type: actionTypes.editorSave});
  };
}

function editorSaveReducer (state, action) {
  return state.setIn(['editor', 'save'], {state: 'pending'});
}

function editorSaveFailedReducer (state, {payload: {error}}) {
  return state.setIn(['editor', 'save'], {state: 'failure', error});
}

function editorSaveSucceededReducer (state, action) {
  return state.update('editor', editor => editor
    .set('save', {state: 'success'})
    .set('unsaved', false)
  );
}

function* editorSaveAudioSaga (_app, _action) {
  const {id, name} = yield select(function (state) {
    const editor = state.get('editor');
    const id = editor.get('base').replace(/^.*\//, '');
    const name = (editor.get('data').name || '').trim();
    return {id, name};
  });
  const saveAsName = `${name || id}.mp3`;
  const blob = yield select(state => state.getIn(['editor', 'audioBlob']));
  yield call(FileSaver.saveAs, blob, saveAsName);
}

function* editorSaveSaga ({actionTypes}, _action) {
  const {baseUrl, base, name} = yield select(function (state) {
    const {baseUrl} = state.get('options');
    const editor = state.get('editor');
    const base = editor.get('base');
    const {name} = editor.get('data');
    return {baseUrl, base, name};
  });
  const changes = {name};
  let result;
  try {
    result = yield call(postJson, `${baseUrl}/save`, {base, changes});
  } catch (ex) {
    result = {error: ex.toString()};
  }
  if (result.error) {
    yield put({type: actionTypes.editorSaveFailed, payload: {error: result.error}});
    return;
  }
  yield put({type: actionTypes.editorSaveSucceeded});
}
