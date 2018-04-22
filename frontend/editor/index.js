
import Immutable from 'immutable';
import React from 'react';
import classnames from 'classnames';
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';

import {Button, ControlGroup, Intent, Label, Tab, Tabs} from '@blueprintjs/core';
import {getJson, postJson} from '../common/utils';

export default function (bundle, deps) {

  bundle.addReducer('init', state =>
    state.set('editor', Immutable.Map()));

  bundle.defineAction('editorPrepare', 'Editor.Prepare');
  bundle.addReducer('editorPrepare', editorPrepareReducer);

  bundle.defineAction('editorConfigured', 'Editor.Configured');
  bundle.addReducer('editorConfigured', editorConfiguredReducer);

  bundle.defineAction('editorLoaded', 'Editor.Loaded');
  bundle.addReducer('editorLoaded', editorLoadedReducer);

  bundle.defineAction('setupScreenTabChanged', 'Editor.Setup.TabChanged');
  bundle.addReducer('setupScreenTabChanged', setupScreenTabChangedReducer);

  bundle.defineView('EditorApp', EditorAppSelector, EditorApp);
  bundle.defineView('EditorGlobalControls', EditorGlobalControlsSelector, EditorGlobalControls);

  bundle.defineView('SetupScreen', SetupScreenSelector, SetupScreen);
  bundle.defineView('EditScreen', EditScreenSelector, EditScreen);
  bundle.defineView('TrimEditor', TrimEditorSelector, TrimEditor);

  bundle.addSaga(editorSaga);

};

function editorPrepareReducer (state, {payload: {baseDataUrl}}) {
  return state.set('editor', Immutable.Map({
    dataUrl: baseDataUrl, loading: true,
    setupTabId: 'setup-tab-infos'
  }));
}

function editorConfiguredReducer (state, {payload: {bucketUrl}}) {
  return state.setIn(['editor', 'bucketUrl'], bucketUrl);
}

function* editorSaga () {
  const {editorPrepare, loginFeedback} = yield select(state => state.get('scope'));
  yield takeEvery(editorPrepare, editorPrepareSaga);
  yield takeEvery(loginFeedback, loginFeedbackSaga);
}

function* editorPrepareSaga ({payload: {baseDataUrl}}) {
  const {subtitlesModeSet, playerPrepare, playerReady, editorLoaded, switchToScreen} = yield select(state => state.get('scope'));
  yield put({type: switchToScreen, payload: {screen: 'setup'}});
  /* XXX only put subtitlesModeSet(editor) when selecting 'edit subtitles' task */
  yield put({type: subtitlesModeSet, payload: {mode: 'editor'}});
  const audioUrl = `${baseDataUrl}.mp3`;
  const eventsUrl = `${baseDataUrl}.json`;
  yield put({type: playerPrepare, baseDataUrl, audioUrl, eventsUrl}); /* NOT-FSA */
  const {data} = yield take(playerReady);
  yield put({type: editorLoaded, payload: {baseDataUrl, data}});
}

function* loginFeedbackSaga (_action) {
  const {editorConfigured, switchToScreen} = yield select(state => state.get('scope'));
  const baseUrl = yield select(state => state.get('baseUrl'));
  const {bucketUrl} = yield call(getJson, `${baseUrl}/editor.json`);
  yield put({type: editorConfigured, payload: {bucketUrl}});
}

function editorLoadedReducer (state, {payload: {baseDataUrl, data}}) {
  return state.update('editor', editor => editor
    .set('base', baseDataUrl)
    .set('data', data)
    .set('loading', false));
}

function setupScreenTabChangedReducer (state, {payload: {tabId}}) {
  return state.setIn(['editor', 'setupTabId'], tabId);
}

function EditorAppSelector (state, props) {
  const scope = state.get('scope');
  const {EditorGlobalControls} = scope;
  const user = state.get('user');
  const screen = state.get('screen');
  let activity, screenProp, Screen;
  if (!user) {
    activity = 'login';
    screenProp = 'LoginScreen';
  } else if (screen === 'setup') {
    activity = 'setup';
    screenProp = 'SetupScreen';
  } else if (screen === 'edit') {
    activity = 'edit';
    screenProp = 'EditScreen';
  } else {
    Screen = <p>{'undefined state'}</p>;
  }
  if (!Screen && screenProp) {
    Screen = scope[screenProp];
  }
  return {Screen, activity, EditorGlobalControls};
}

class EditorApp extends React.PureComponent {
  render () {
    const {EditorGlobalControls, Screen, activity} = this.props;
    return (
      <div>
        <EditorGlobalControls activity={activity}/>
        <Screen/>
      </div>
    );
  }
}

function EditorGlobalControlsSelector (state) {
  const {LogoutButton, subtitlesEditorReturn} = state.get('scope');
  return {LogoutButton, subtitlesEditorReturn};
}

class EditorGlobalControls extends React.PureComponent {
  render () {
    const {LogoutButton, activity} = this.props;
    const {collapsed} = this.state;
    return (
      <div id='global-controls' className={classnames({collapsed})}>
        <span className='collapse-toggle' onClick={this._toggleCollapsed}>
          <i className={`fa fa-chevron-${collapsed ? 'down' : 'up'}`}/>
        </span>
        <div className='btn-group'>
          {activity === 'edit' && <Button onClick={this._return}><i className='fa fa-reply'/></Button>}
          {/load|setup/.test(activity) && <LogoutButton/>}
        </div>
      </div>
    );
  }
  state = {collapsed: false};
  _toggleCollapsed = () => {
    const {collapsed} = this.state;
    this.setState({collapsed: !collapsed});
  };
  _return = () => {
    this.props.dispatch({type: this.props.subtitlesEditorReturn}); /* XXX subtitlesEditorReturn is specialized for subtitles */
  };
}

function SetupScreenSelector (state, props) {
  const editor = state.get('editor');
  const tabId = editor.get('setupTabId');
  const dataUrl = editor.get('dataUrl');
  const loading = editor.get('loading');
  if (loading) return {loading, dataUrl};
  const {TrimEditor, SubtitlesEditor, setupScreenTabChanged} = state.get('scope');
  const {version} = editor.get('data');
  return {
    tabId, loading, dataUrl, version,
    TrimEditor, SubtitlesEditor, setupScreenTabChanged
  };
}

class SetupScreen extends React.PureComponent {
  render () {
    const {tabId, loading, dataUrl, version, TrimEditor, SubtitlesEditor} = this.props;
    if (loading) {
      return <p>{"loading, please wait"}</p>;
    }
    const infosPanel = (
      <div>
        <p>{"URL "}{dataUrl}</p>
        <p>{"Version "}{version}</p>
        {/* recording length in mm:ss */}
        {/* number of events */}
        {/* list of available subtitles */}
      </div>
    );
    return (
      <div className='cc-container'>
        <h1 style={{margin: '20px 0'}}>{"Codecast Editor"}</h1>


        <Tabs id='setup-tabs' onChange={this.handleTabChange} selectedTabId={tabId} large={true}>
          <Tab id='setup-tab-infos' title="Information" panel={infosPanel} />
          <Tab id='setup-tab-trim' title="Trim" panel={<TrimEditor/>} />
          <Tab id='setup-tab-subtitles' title="Subtitles" panel={<SubtitlesEditor/>} />
        </Tabs>

      </div>
    );
  }
  handleTabChange = (newTabId) => {
    this.props.dispatch({type: this.props.setupScreenTabChanged, payload: {tabId: newTabId}});
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

function TrimEditorSelector (state, props) {
  return {}
}

class TrimEditor extends React.PureComponent {
  render () {
    return <p>{"Trim"}</p>;
  }
}
