
import Immutable from 'immutable';
import React from 'react';
import classnames from 'classnames';
import {eventChannel} from 'redux-saga'
import {call, put, select, take, takeEvery, takeLatest} from 'redux-saga/effects';
import {Button, ControlGroup, Intent, Label, ProgressBar, Tab, Tabs} from '@blueprintjs/core';

import {getJson, postJson, getAudio} from '../common/utils';
import TrimBundle from './trim';

export default function (bundle, deps) {

  bundle.addReducer('init', state =>
    state.set('editor', Immutable.Map()));

  bundle.defineAction('editorPrepare', 'Editor.Prepare');
  bundle.addReducer('editorPrepare', editorPrepareReducer);

  bundle.defineAction('editorAudioLoadProgress', 'Editor.Audio.LoadProgress');
  bundle.addReducer('editorAudioLoadProgress', editorAudioLoadProgressReducer);

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

  bundle.addSaga(editorSaga);

  bundle.include(TrimBundle);

};

function editorPrepareReducer (state, {payload: {baseDataUrl}}) {
  return state.set('editor', Immutable.Map({
    dataUrl: baseDataUrl, loading: true,
    setupTabId: 'setup-tab-infos',
    audioLoadProgress: 0,
  }));
}

function editorAudioLoadProgressReducer (state, {payload: {value}}) {
  return state.setIn(['editor', 'audioLoadProgress'], value);
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
  /* Load the audio stream. */
  const audioBuffer = yield call(getAudioSaga, audioUrl);
  const duration = audioBuffer.duration;
  /* Prepare the player and wait until ready.
     This order (load audio, prepare player) is faster, the reverse
     (as of Chrome 64) leads to redundant concurrent fetches of the audio. */
  yield put({type: playerPrepare, payload: {baseDataUrl, audioUrl, eventsUrl}});
  const {payload: {data}} = yield take(playerReady);
  // TODO: send progress events during extractWaveform?
  const waveform = extractWaveform(audioBuffer, Math.floor(duration * 60));
  yield put({type: editorLoaded, payload: {baseDataUrl, data, duration, waveform}});
}

function* getAudioSaga (audioUrl) {
  const {editorAudioLoadProgress} = yield select(state => state.get('actionTypes'));
  const chan = yield call(getAudio, audioUrl);
  while (true) {
    let event = yield take(chan);
    switch (event.type) {
      case 'done':
        return event.audioBuffer;
      case 'error':
        throw event.error;
      case 'progress':
        yield put({type: editorAudioLoadProgress, payload: {value: event.value}});
        break;
    }
  }
}

function* loginFeedbackSaga (_action) {
  const {editorConfigured, switchToScreen} = yield select(state => state.get('scope'));
  const baseUrl = yield select(state => state.get('baseUrl'));
  const {bucketUrl} = yield call(getJson, `${baseUrl}/editor.json`);
  yield put({type: editorConfigured, payload: {bucketUrl}});
}

function editorLoadedReducer (state, {payload: {baseDataUrl, data, duration, waveform}}) {
  return state.update('editor', editor => editor
    .set('base', baseDataUrl)
    .set('data', data)
    .set('waveform', waveform)
    .set('duration', duration)
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
  const dataUrl = editor.get('dataUrl');
  const loading = editor.get('loading');
  if (loading) {
    const audioLoadProgress = editor.get('audioLoadProgress');
    return {loading, audioLoadProgress, dataUrl};
  }
  const duration = editor.get('duration');
  const tabId = editor.get('setupTabId');
  const {TrimEditor, SubtitlesEditor, setupScreenTabChanged} = state.get('scope');
  const {version, events} = editor.get('data');
  const waveform = editor.get('waveform');
  return {
    loading, tabId, dataUrl, version, events, duration, waveform,
    TrimEditor, SubtitlesEditor, setupScreenTabChanged
  };
}

class SetupScreen extends React.PureComponent {
  render () {
    const {loading} = this.props;
    if (loading) {
      const {audioLoadProgress} = this.props;
      return (
        <div className='cc-container'>
          <p style={{marginTop: '20px'}}>{"Loading, please wait…"}</p>
          <ProgressBar value={audioLoadProgress}/>
        </div>
      );
    }
    const {tabId, dataUrl, version, events, duration, waveform, TrimEditor, SubtitlesEditor} = this.props;
    const infosPanel = (
      <div>
        <p>{"Base URL "}{dataUrl}</p>
        <p>{"Duration "}{duration}</p>
        <p>{"Version "}{version}</p>
        <WideView duration={duration} waveform={waveform} events={events} />
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

class WideView extends React.PureComponent {
  render () {
    return <canvas height='100' width='800' ref={this.refCanvas} />;
  }
  componentDidMount () {
    const {duration, waveform, events} = this.props;
    const hMargin = 3;
    const imageWidth = this.canvas.width;
    const width = imageWidth - hMargin * 2;
    const height = this.canvas.height;
    const scale = width / (duration * 1000);
    this._miniWaveform = downsampleWaveform(waveform, width);
    this._params = {width, height, scale, x0: hMargin};
    this.updateCanvas();
  }
  componentDidUpdate () {
    this.updateCanvas();
  }
  updateCanvas = () => {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    renderWaveform(ctx, this._params, this._miniWaveform);
    renderEvents(ctx, this._params, this.props.events);
  };
  refCanvas = (canvas) => {
    this.canvas = canvas;
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

function createOffscreenCanvas (width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function extractWaveform (buffer, tgt_length) {
  const src_length = buffer.length;
  let src_start = 0;
  let ip = Math.floor(src_length / tgt_length);
  let fp = src_length % tgt_length;
  let error = 0;
  let tgt_pos = 0;
  const tgt = new Float32Array(tgt_length);
  let maxValue = 0;
  while (src_start < src_length) {
    let src_end = src_start + ip;
    error += fp;
    if (error >= tgt_length) {
      error -= tgt_length;
      src_end += 1;
    }
    let value = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let pos = src_start; pos < src_end; pos += 1) {
        value += Math.abs(data[pos]);
      }
    }
    value = value / (src_end - src_start) / buffer.numberOfChannels;
    if (value > maxValue) {
      maxValue = value;
    }
    tgt[tgt_pos] = value;
    tgt_pos += 1;
    src_start = src_end;
  }
  if (maxValue > 0) {
    for (tgt_pos = 0; tgt_pos < tgt_length; tgt_pos += 1) {
      tgt[tgt_pos] /= maxValue;
    }
  }
  return tgt;
}

function downsampleWaveform (waveform, tgt_length) {
  const src_length = waveform.length;
  let src_start = 0;
  let ip = Math.floor(src_length / tgt_length);
  let fp = src_length % tgt_length;
  let error = 0;
  let tgt_pos = 0;
  const tgt = new Float32Array(tgt_length);
  let maxValue = 0;
  while (src_start < src_length) {
    let src_end = src_start + ip;
    error += fp;
    if (error >= tgt_length) {
      error -= tgt_length;
      src_end += 1;
    }
    let value = 0;
    for (let pos = src_start; pos < src_end; pos += 1) {
      value += waveform[pos];
    }
    value = value / (src_end - src_start);
    tgt[tgt_pos] = value;
    tgt_pos += 1;
    src_start = src_end;
  }
  return tgt;
}

function renderWaveform (ctx, {width, height, x0}, samples) {
  const midY = height / 2;
  const scaleY = height * 0.8; /* 160% zoom */
  ctx.strokeStyle = '#d8d8d8';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 1) {
    const y = samples[x] * scaleY;
    ctx.beginPath();
    ctx.moveTo(x0 + x, midY - y);
    ctx.lineTo(x0 + x, midY + y + 1);
    ctx.stroke();
  }
}

function renderEvents (ctx, {height, scale, x0}, events) {
  const lineHeight = 5;
  const y0 = (height - lineHeight) / 2;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let event of events) {
    const x = x0 + Math.round(event[0] * scale);
    let line = 0;
    const t = event[1];
    if (/^(start|end|translate)/.test(t)) {
      line = -1;
      ctx.strokeStyle = '#f55656'; // @red4
    } else if (/^buffer\.(insert|delete)/.test(t)) {
      line = 1;
      ctx.strokeStyle = '#2b95d6'; // @blue4
    } else if (/^terminal|ioPane|arduino/.test(t)) {
      line = 1;
      ctx.strokeStyle = '#f29d49'; // @orange4
    } else if (/^stepper/.test(t)) {
      line = 2;
      ctx.strokeStyle = '#15b371'; // @green4
    } else {
      ctx.strokeStyle = '#5c7080'; // @gray1
    }
    ctx.beginPath();
    ctx.moveTo(x - 1, y0 + line * lineHeight);
    ctx.lineTo(x + 2, y0 + line * lineHeight);
    ctx.stroke();
  }
}
