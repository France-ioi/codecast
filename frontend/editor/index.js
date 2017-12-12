
import Immutable from 'immutable';
import React from 'react';
import classnames from 'classnames';
import FileInput from 'react-file-input';
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';

import {Button} from '../ui';
import {getJson} from '../common/utils';

export default function (bundle, deps) {

  bundle.addReducer('init', state =>
    state.set('editor', Immutable.Map()));

  bundle.defineAction('editorPrepare', 'Editor.Prepare');
  bundle.addReducer('editorPrepare', editorPrepareReducer);
  bundle.addSaga(editorSaga);

  bundle.defineAction('editorConfigured', 'Editor.Configured');
  bundle.addReducer('editorConfigured', editorConfiguredReducer);

  bundle.defineAction('editorDataUrlChanged', 'Editor.DataUrl.Changed');
  bundle.addReducer('editorDataUrlChanged', editorDataUrlChangedReducer);

  bundle.defineAction('editorLoad', 'Editor.Load');
  bundle.addReducer('editorLoad', editorLoadReducer);
  bundle.defineAction('editorLoaded', 'Editor.Loaded');
  bundle.addReducer('editorLoaded', editorLoadedReducer);

  bundle.defineAction('editorUnload', 'Editor.Unload');
  bundle.addReducer('editorUnload', editorUnloadReducer);

  bundle.defineAction('editorSave', 'Editor.Save');

  bundle.defineAction('editorSubtitlesSelected', 'Editor.Subtitles.Selected');
  bundle.addReducer('editorSubtitlesSelected', editorSubtitlesSelectedReducer);

  bundle.defineView('EditorApp', EditorAppSelector, EditorApp);
  bundle.defineView('LoadScreen', LoadScreenSelector, LoadScreen);
  bundle.defineView('SetupScreen', SetupScreenSelector, SetupScreen);
  bundle.defineView('EditScreen', EditScreenSelector, EditScreen);

};

function editorPrepareReducer (state, {payload: {baseDataUrl}}) {
  return state.set('editor', Immutable.Map({dataUrl: baseDataUrl}));
}

function editorDataUrlChangedReducer (state, {payload: {dataUrl}}) {
  return state.setIn(['editor', 'dataUrl'], dataUrl);
}

function editorConfiguredReducer (state, {payload: {bucketUrl}}) {
  return state.setIn(['editor', 'bucketUrl'], bucketUrl);
}

function* editorSaga () {
  const {editorPrepare, loginFeedback, editorLoad, editorUnload, editorSave} = yield select(state => state.get('scope'));
  yield takeEvery(editorPrepare, editorPrepareSaga);
  yield takeEvery(loginFeedback, loginFeedbackSaga);
  yield takeLatest(editorLoad, editorLoadSaga);
  yield takeLatest(editorUnload, editorUnloadSaga);
  yield takeLatest(editorSave, editorSaveSaga);
}

function* editorPrepareSaga (_action) {
  const {subtitlesModeSet, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: subtitlesModeSet, payload: {mode: 'editor'}});
  yield put({type: switchToScreen, payload: {screen: 'load'}});
}

function* loginFeedbackSaga (_action) {
  const {editorConfigured, switchToScreen} = yield select(state => state.get('scope'));
  const baseUrl = yield select(state => state.get('baseUrl'));
  const {bucketUrl} = yield call(getJson, `${baseUrl}/editor.json`);
  yield put({type: editorConfigured, payload: {bucketUrl}});
}

function editorLoadReducer (state, {payload: {data}}) {
  return state.update('editor', editor =>
    editor.set('loading', true));
}

function* editorLoadSaga ({payload: {dataUrl}}) {
  const {playerPrepare, playerReady, editorLoaded, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: playerPrepare, baseDataUrl: dataUrl});
  const {data} = yield take(playerReady);
  yield put({type: editorLoaded, payload: {data}});
  yield put({type: switchToScreen, payload: {screen: 'setup'}});
}

function editorLoadedReducer (state, {payload: {data}}) {
  return state.update('editor', editor =>
    editor.set('data', data).set('loading', false));
}

function editorUnloadReducer (state, _action) {
  return state.update('editor', editor => editor.delete('data'));
}

function* editorUnloadSaga (_action) {
  const {playerClear, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: playerClear});
  yield put({type: switchToScreen, payload: {screen: 'load'}});
}

function* editorSaveSaga (_action) {
  const {switchToScreen} = yield select(state => state.get('scope'));
  // TODO: save
  yield put({type: switchToScreen, payload: {screen: 'setup'}});
}

function editorSubtitlesSelectedReducer (state, {payload: {option}}) {
  return state.setIn(['editor', 'selectedSubtitles'], option);
}

function EditorAppSelector (state, props) {
  const scope = state.get('scope');
  const {LogoutButton, editorUnload, editorSave} = scope;
  const user = state.get('user');
  const screen = state.get('screen');
  let activity;
  let screenProp;
  if (!user) {
    activity = 'login';
    screenProp = 'LoginScreen';
  } else if (screen === 'load') {
    activity = 'load';
    screenProp = 'LoadScreen';
  } else if (screen === 'setup') {
    activity = 'setup';
    screenProp = 'SetupScreen';
  } else if (screen === 'edit') {
    activity = 'edit';
    screenProp = 'EditScreen';
  } else if (screen === 'save') {
    activity = 'save';
    screenProp = 'SaveScreen';
  }
  return {Screen: screenProp && scope[screenProp], LogoutButton, editorUnload, editorSave, activity};
}

class EditorApp extends React.PureComponent {
  render () {
    const {Screen, LogoutButton, activity} = this.props;
    return (
      <div>
        <LogoutButton/>
        {activity === 'setup' && <Button onClick={this._unload}><i className='fa fa-reply'/></Button>}
        {activity === 'edit' && <Button onClick={this._save} bsStyle='primary'><i className='fa fa-save'/></Button>}
        <Screen/>
      </div>
    );
  }
  _unload = () => {
    this.props.dispatch({type: this.props.editorUnload});
  };
  _save = () => {
    this.props.dispatch({type: this.props.editorSave});
  };
}

function LoadScreenSelector (state, props) {
  const {editorDataUrlChanged, editorLoad} = state.get('scope');
  const result = {editorDataUrlChanged, editorLoad};
  const editor = state.get('editor');
  result.dataUrl = editor.get('dataUrl');
  result.bucketUrl = editor.get('bucketUrl');
  result.loading = editor.get('loading');
  return result;
}

class LoadScreen extends React.PureComponent {
  render () {
    const {dataUrl, bucketUrl, loading} = this.props;
    const isUrlOk = bucketUrl && dataUrl.startsWith(bucketUrl);
    return (
      <div className='container'>
        <p>{"Enter the base URL of an existing Codecast:"}</p>
        <div className='input-group'>
          <input type='text' className='form-control' onChange={this._urlChanged} value={dataUrl||''} />
          <div className='input-group-btn'>
            <Button bsStyle='primary' disabled={!isUrlOk || loading} onClick={this._loadClicked}>
              {"Load"}
              {loading && <span>{" "}<i className='fa fa-hourglass-o'/></span>}
            </Button>
          </div>
        </div>
        {bucketUrl && !isUrlOk &&
          <p className='error'>
            {"The URL must start with "}{bucketUrl||''}
          </p>}
        {bucketUrl && isUrlOk &&
          <p>
            <i className='fa fa-check' style={{color: 'green'}}/>
            {" The URL is valid."}
          </p>}
      </div>
    );
  }
  _urlChanged = (event) => {
    const dataUrl = event.target.value;
    this.props.dispatch({type: this.props.editorDataUrlChanged, payload: {dataUrl}});
  };
  _loadClicked = () => {
    this.props.dispatch({type: this.props.editorLoad, payload: {dataUrl: this.props.dataUrl}});
  };
}

function SetupScreenSelector (state, props) {
  const {editorSubtitlesSelected, subtitlesLoadFromUrl, subtitlesLoadFromFile,
    subtitlesCleared, subtitlesAvailableSelector, switchToScreen} = state.get('scope');
  const editor = state.get('editor');
  const dataUrl = editor.get('dataUrl');
  const {version} = editor.get('data')
  const availableSubtitles = subtitlesAvailableSelector(state);
  const selectedSubtitles = editor.get('selectedSubtitles');
  const subtitlesText = state.get('subtitles').text; /* TODO: use selector */
  return {editorSubtitlesSelected, subtitlesLoadFromUrl, subtitlesLoadFromFile,
    subtitlesCleared, switchToScreen, availableSubtitles, selectedSubtitles,
    subtitlesText, dataUrl, version};
}

class SetupScreen extends React.PureComponent {
  render () {
    const {dataUrl, version, availableSubtitles, selectedSubtitles, subtitlesText} = this.props;
    return (
      <div className='container'>
        <h2>{"Codecast"}</h2>
        <p>{"URL "}{dataUrl}</p>
        <p>{"Version "}{version}</p>

        <h2>{"Subtitles"}</h2>
        <div className='row'>
          <div className='col-sm-6'>
            <div className='form-inline'>
              <p>{"Select language : "}</p>
              {availableSubtitles.map(option =>
                <SubtitlesOption key={option.key} option={option} selected={selectedSubtitles && selectedSubtitles.key === option.key} onSelect={this._subtitlesSelected} />)}
            </div>
            {selectedSubtitles &&
              <div className='form-inline'>
                <p>{"Action on selected language : "}</p>
                <Button onClick={this._loadSubtitles}><i className='fa fa-download'/></Button>
                <div className='input-group'>
                   <FileInput name='upload-srt' accept=".srt" placeholder={`load SRT file`} className='form-control' onChange={this._replaceSubtitles} />
                   <span className='input-group-addon'><i className='fa fa-upload'/></span>
                </div>
                <Button onClick={this._clearSubtitles}><i className='fa fa-remove'/></Button>
              </div>}
          </div>
          <div className='col-sm-6'>
            <textarea readOnly rows={7} style={{width: '100%'}} value={subtitlesText}/>
          </div>
        </div>

        <div style={{marginTop: '10px'}}>
          <Button bsStyle='primary' onClick={this._beginEdit}>
            <i className='fa fa-edit'/>{" Edit Codecast"}
          </Button>
        </div>
      </div>
    );
  }
  _subtitlesSelected = (option) => {
    this.props.dispatch({type: this.props.editorSubtitlesSelected, payload: {option}});
  };
  _beginEdit = (event) => {
    this.props.dispatch({type: this.props.switchToScreen, payload: {screen: 'edit'}});
  };
  _clearSubtitles = (event) => {
    this.props.dispatch({type: this.props.subtitlesCleared});
  };
  _loadSubtitles = (event) => {
    const {selectedSubtitles: {key, url}} = this.props;
    this.props.dispatch({type: this.props.subtitlesLoadFromUrl, payload: {key, url}});
  };
  _replaceSubtitles = (event) => {
    const {selectedSubtitles: {key}} = this.props;
    const file = event.target.files[0];
    this.props.dispatch({type: this.props.subtitlesLoadFromFile, payload: {key, file}});
  };
}

class SubtitlesOption extends React.PureComponent {
  render () {
    const {option, selected} = this.props;
    return <Button onClick={this._clicked} active={selected}>{option.key}</Button>;
  }
  _clicked = () => {
    this.props.onSelect(this.props.option);
  };
}

function EditScreenSelector (state, props) {
  const {PlayerControls, MainView, MainViewPanes, SubtitlesBand, getPlayerState} = state.get('scope');
  const playerStatus = getPlayerState(state).get('status');
  const preventInput = !/ready|paused/.test(playerStatus);
  const viewportTooSmall = state.get('viewportTooSmall');
  const containerWidth = state.get('containerWidth');
  const showSubtitlesBand = state.get('showSubtitlesBand');
  return {
    preventInput, viewportTooSmall, containerWidth,
    PlayerControls, MainView, MainViewPanes,
    showSubtitlesBand, SubtitlesBand
  };
}

class EditScreen extends React.PureComponent {
  render () {
    const {preventInput, containerWidth, viewportTooSmall, PlayerControls, MainView, MainViewPanes, showSubtitlesBand, SubtitlesBand} = this.props;
    return (
      <div id='main' style={{width: `${containerWidth}px`}} className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
        <PlayerControls/>
        <div id='mainView-container'>
          <MainView preventInput={preventInput}/>
          <MainViewPanes/>
        </div>
        {showSubtitlesBand && <SubtitlesBand/>}
      </div>
    );
  }
}

/*
function subtitlesAddLanguageReducer (state, action) {
  return state.updateIn(['player', 'data'],
    data => update(data, {subtitles: {$push: [key]}}));
}
*/
