
/* "Loading subtitles" in this context means parsing a SRT resource
   (obtained in a number of ways) and making the individual subtitle
   items ({start, end, text} objects, timestamps in milliseconds) */

import srtParse from 'subtitle/lib/parse';
import srtStringify from 'subtitle/lib/stringify';
import {takeLatest, put, call, select} from 'redux-saga/effects';
import update from 'immutability-helper';

import {readFileAsText} from '../common/utils';
import {updateCurrentItem, filterItems, getSubtitles} from './utils';

export default function (bundle) {

  /* Clear (unload) the currently loaded subtitles, if any. */
  bundle.defineAction('subtitlesCleared', 'Subtitles.Cleared');
  bundle.addReducer('subtitlesCleared', subtitlesClearedReducer);

  /* subtitlesLoadFromText({key, text}) loads SRT subtitles from a string. */
  bundle.defineAction('subtitlesLoadFromText', 'Subtitles.LoadFromText');

  /* subtitlesLoadFromUrl({key, url}) loads SRT subtitles from a URL. */
  bundle.defineAction('subtitlesLoadFromUrl', 'Subtitles.LoadFromUrl');

  /* subtitlesLoadFromFile({key, file}) loads SRT subtitles from a (local)
     File object. */
  bundle.defineAction('subtitlesLoadFromFile', 'Subtitles.LoadFromFile');

  /* subtitlesReload() reloads the currently selected subtitles.
     This is needed for the editor, in case the user has directly edited
     the text. */
  bundle.defineAction('subtitlesReload', 'Subtitles.Reload');

  bundle.defineAction('subtitlesLoadStarted', 'Subtitles.LoadStarted');
  bundle.addReducer('subtitlesLoadStarted', subtitlesLoadStartedReducer);
  bundle.defineAction('subtitlesLoadSucceeded', 'Subtitles.LoadSucceeded');
  bundle.addReducer('subtitlesLoadSucceeded', subtitlesLoadSucceededReducer);
  bundle.defineAction('subtitlesLoadFailed', 'Subtitles.LoadFailed');
  bundle.addReducer('subtitlesLoadFailed', subtitlesLoadFailedReducer);

  bundle.addSaga(subtitlesLoadSaga);

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

function subtitlesLoadFailedReducer (state, {payload: {error}}) {
  let errorText = state.get('getMessage')('SUBTITLES_FAILED_TO_LOAD').s;
  if (error.res) {
    errorText = `${errorText} (${error.res.statusCode})`;
  }
  return state.update('subtitles', subtitles => (
    {...subtitles, loaded: false, loading: false, lastError: errorText, text: errorText, loadedKey: 'none'}));
}

function* subtitlesLoadSaga () {
  const scope = yield select(state => state.get('scope'));
  yield takeLatest(scope.subtitlesLoadFromText, subtitlesLoadFromTextSaga);
  yield takeLatest(scope.subtitlesLoadFromUrl, subtitlesLoadFromUrlSaga);
  yield takeLatest(scope.subtitlesLoadFromFile, subtitlesLoadFromFileSaga);
  yield takeLatest(scope.subtitlesReload, subtitlesReloadSaga);
}

function* subtitlesLoadFromTextSaga ({payload: {key, text}}) {
  const scope = yield select(state => state.get('scope'));
  yield put({type: scope.subtitlesLoadStarted, payload: {key}});
  let items;
  try {
    items = srtParse(text);
  } catch (ex) {
    yield put({type: scope.subtitlesLoadFailed, payload: {error: ex}});
    return;
  }
  yield put({type: scope.subtitlesLoadSucceeded, payload: {key, text, items}});
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
    /* Generate an initial item covering the entire recording (needed because
       the editor works by splitting existing items at a specific position). */
    let text = (availableOptions[key].text || '').trim();
    if (!text) {
      const data = yield select(state => state.getIn(['player', 'data']));
      text = srtStringify([{start: 0, end: data.events[data.events.length - 1][0], text: ''}]);
    }
    yield put({type: scope.subtitlesLoadFromText, payload: {key, text}});
  }
}
