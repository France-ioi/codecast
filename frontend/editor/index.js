
import Immutable from 'immutable';
import React from 'react';
import classnames from 'classnames';
import {eventChannel} from 'redux-saga'
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import {Callout, Intent, ProgressBar, Tab, Tabs} from '@blueprintjs/core';

import {getJson, getAudio} from '../common/utils';
import {extractWaveform} from './waveform/tools';
import OverviewBundle from './overview';
import TrimBundle from './trim';

export default function (bundle, deps) {

  bundle.addReducer('init', state =>
    state.set('editor', Immutable.Map()));

  bundle.defineAction('editorPrepare', 'Editor.Prepare');
  bundle.addReducer('editorPrepare', editorPrepareReducer);

  bundle.defineAction('editorControlsChanged', 'Editor.Controls.Changed');
  bundle.addReducer('editorControlsChanged', editorControlsChangedReducer);

  bundle.defineAction('editorAudioLoadProgress', 'Editor.Audio.LoadProgress');
  bundle.addReducer('editorAudioLoadProgress', editorAudioLoadProgressReducer);

  bundle.defineAction('editorAudioLoaded', 'Editor.Audio.Loaded');
  bundle.addReducer('editorAudioLoaded', editorAudioLoadedReducer);

  bundle.defineAction('editorPlayerReady', 'Editor.Player.Ready');
  bundle.addReducer('editorPlayerReady', editorPlayerReadyReducer);

  bundle.defineAction('setupScreenTabChanged', 'Editor.Setup.TabChanged');
  bundle.addReducer('setupScreenTabChanged', setupScreenTabChangedReducer);

  bundle.defineView('EditorApp', EditorAppSelector, EditorApp);

  bundle.defineView('SetupScreen', SetupScreenSelector, SetupScreen);
  bundle.defineView('EditScreen', EditScreenSelector, EditScreen);

  bundle.addSaga(function* editorSaga (app) {
    yield takeEvery(app.actionTypes.editorPrepare, editorPrepareSaga, app);

  });

  bundle.include(OverviewBundle);
  bundle.include(TrimBundle);

};

function editorPrepareReducer (state, {payload: {baseDataUrl}}) {
  const {baseUrl} = state.get('options');
  let canSave = false;
  for (let grant of state.get('user').grants) {
    if (baseDataUrl.startsWith(grant.url)) {
      canSave = true;
      break;
    }
  }
  return state.set('editor', Immutable.Map({
    base: baseDataUrl,
    dataUrl: baseDataUrl,
    playerUrl: `${baseUrl}/player?base=${encodeURIComponent(baseDataUrl)}`,
    setupTabId: 'setup-tab-infos',
    audioLoadProgress: 0,
    controls: {floating: [], top: []},
    canSave
  }));
}

function editorControlsChangedReducer (state, {payload: {controls}}) {
  return state.updateIn(['editor', 'controls'], oldControls =>
    ({...oldControls, ...controls}));
}

function editorAudioLoadProgressReducer (state, {payload: {value}}) {
  return state.setIn(['editor', 'audioLoadProgress'], value);
}

function* editorPrepareSaga ({actionTypes}, {payload: {baseDataUrl}}) {
  /* Require the user to be logged in. */
  while (!(yield select(state => state.get('user')))) {
    yield take(actionTypes.loginFeedback);
    console.log('got login feedback', yield select(state => state.get('user')));
  }
  yield put({type: actionTypes.switchToScreen, payload: {screen: 'setup'}});
  const audioUrl = `${baseDataUrl}.mp3`;
  const eventsUrl = `${baseDataUrl}.json`;
  /* Load the audio stream. */
  const {blob: audioBlob, audioBuffer} = yield call(getAudioSaga, actionTypes, audioUrl);
  const inMemoryAudioUrl = URL.createObjectURL(audioBlob);
  const duration = audioBuffer.duration * 1000;
  // TODO: send progress events during extractWaveform?
  const waveform = extractWaveform(audioBuffer, Math.floor(duration * 60 / 1000));
  yield put({type: actionTypes.editorAudioLoaded, payload: {duration, audioBlob, audioBuffer, waveform}});
  /* Prepare the player and wait until ready.
     This order (load audio, prepare player) is faster, the reverse
     (as of Chrome 64) leads to redundant concurrent fetches of the audio. */
  yield put({type: actionTypes.playerPrepare, payload: {baseDataUrl, audioUrl: inMemoryAudioUrl, eventsUrl}});
  const {payload: {data}} = yield take(actionTypes.playerReady);
  yield put({type: actionTypes.editorPlayerReady, payload: {data}});
}

function* getAudioSaga (actionTypes, audioUrl) {
  const chan = yield call(getAudio, audioUrl);
  while (true) {
    let event = yield take(chan);
    switch (event.type) {
      case 'done':
        return event;
      case 'error':
        throw event.error;
      case 'progress':
        yield put({type: actionTypes.editorAudioLoadProgress, payload: {value: event.value}});
        break;
    }
  }
}

function editorAudioLoadedReducer (state, {payload: {duration, audioBlob, audioBuffer, waveform}}) {
  return state.update('editor', editor => editor
    .set('audioLoaded', true)
    .set('duration', duration)
    .set('audioBlob', audioBlob)
    .set('audioBuffer', audioBuffer)
    .set('waveform', waveform));
}

function editorPlayerReadyReducer (state, {payload: {data}}) {
  return state.update('editor', editor => editor
    .set('playerReady', true)
    .set('data', data));
}

function setupScreenTabChangedReducer (state, {payload: {tabId}}) {
  return state.setIn(['editor', 'setupTabId'], tabId);
}

function EditorAppSelector (state, props) {
  const scope = state.get('scope');
  const user = state.get('user');
  const screen = state.get('screen');
  const {LogoutButton} = scope;
  const floatingControls = state.getIn(['editor', 'controls']).floating;
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
    Screen = () => <p>{'undefined state'}</p>;
  }
  if (!Screen && screenProp) {
    Screen = scope[screenProp];
  }
  return {Screen, activity, floatingControls, LogoutButton};
}

class EditorApp extends React.PureComponent {
  render () {
    const {Screen, activity, floatingControls, LogoutButton} = this.props;
    const {collapsed} = this.state;
    return (
      <div id='editor-app'>
        <div id='floating-controls' className={classnames({collapsed})}>
          <span className='collapse-toggle' onClick={this._toggleCollapsed}>
            <i className={`fa fa-chevron-${collapsed ? 'down' : 'up'}`}/>
          </span>
          <div className='btn-group'>
            {floatingControls.map((Component, i) => <Component key={i} />)}
            {/load|setup/.test(activity) && <LogoutButton/>}
          </div>
        </div>
        <Screen/>
      </div>
    );
  }
  state = {collapsed: false};
  _toggleCollapsed = () => {
    const {collapsed} = this.state;
    this.setState({collapsed: !collapsed});
  };
}

function SetupScreenSelector (state, props) {
  const editor = state.get('editor');
  const audioLoaded = editor.get('audioLoaded');
  if (!audioLoaded) {
    const progress = editor.get('audioLoadProgress');
    return {step: 'loading', progress};
  }
  const playerReady = editor.get('playerReady');
  if (!playerReady) {
    const progress = state.getIn(['player', 'progress']);
    return {step: 'preparing', progress};
  }
  const views = state.get('views');
  const actionTypes = state.get('actionTypes');
  const duration = editor.get('duration');
  const tabId = editor.get('setupTabId');
  const {version, title, events} = editor.get('data');
  const waveform = editor.get('waveform');
  return {
    views, actionTypes, tabId, version, title, events, duration, waveform
  };
}

class SetupScreen extends React.PureComponent {
  render () {
    const {step, progress} = this.props;
    if (step) {
      return (
        <div className='cc-container'>
          {step === 'loading' &&
           <p style={{marginTop: '20px'}}>{"Loading audio…"}</p>}
          {step === 'preparing' &&
           <p style={{marginTop: '20px'}}>{"Preparing player…"}</p>}
          <ProgressBar value={progress}/>
        </div>
      );
    }
    const {tabId, views} = this.props;
    return (
      <div className='cc-container'>
        <h1 style={{margin: '20px 0'}}>{"Codecast Editor"}</h1>
        <Tabs id='setup-tabs' onChange={this.handleTabChange} selectedTabId={tabId} large={true}>
          <Tab id='setup-tab-infos' title="Overview" panel={<views.EditorOverview/>} />
          <Tab id='setup-tab-subtitles' title="Subtitles" panel={<views.SubtitlesEditor/>} />
          <Tab id='setup-tab-trim' title="Trim" panel={<views.TrimEditor/>} />
        </Tabs>
      </div>
    );
  }
  handleTabChange = (newTabId) => {
    const {dispatch, actionTypes} = this.props;
    dispatch({type: actionTypes.setupScreenTabChanged, payload: {tabId: newTabId}});
  };
}

function EditScreenSelector (state, props) {
  const {StepperView, SubtitlesBand} = state.get('scope');
  const viewportTooSmall = state.get('viewportTooSmall');
  const containerWidth = state.get('containerWidth');
  const topControls = state.getIn(['editor', 'controls']).top;
  return {
    viewportTooSmall, containerWidth, topControls,
    StepperView, SubtitlesBand
  };
}

class EditScreen extends React.PureComponent {
  render () {
    const {containerWidth, viewportTooSmall, topControls, StepperView, SubtitlesBand} = this.props;
    return (
      <div id='main' style={{width: `${containerWidth}px`}} className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
        {topControls.map((Component, i) => <Component key={i} width={containerWidth}/>)}
        <StepperView/>
        <SubtitlesBand/>
      </div>
    );
  }
}
