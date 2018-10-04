
import update from 'immutability-helper';

import {updateCurrentItem} from './utils';
import {getPersistentOptions} from './options';
import {takeLatest, put, select} from 'redux-saga/effects';

export default function (bundle) {

  /* Initialize the available options from the recording's data when the
     player is ready. */
  bundle.addReducer('playerReady', playerReadyReducer);

  /* Update the index of the current item when the player's position
     has changed due to user interaction. */
  bundle.addReducer('playerSeeked', playerSeekedReducer);

  /* Update the index of the current item when the player's position
     has changed due to time advancing. */
  bundle.addReducer('playerTick', playerTickReducer);

  bundle.addSaga(function* () {
    const scope = yield select(state => state.get('scope'));
    /* When the player is ready, automatically reload the last selected
       subtitles language, if available. */
    yield takeLatest(scope.playerReady, function* () {
      const {language} = getPersistentOptions();
      const {availableOptions} = yield select(state => state.get('subtitles'));
      if (language && language !== "none" && language in availableOptions) {
        const option = availableOptions[language];
        yield put({type: scope.subtitlesLoadFromUrl, payload: option});
      }
    });
  });
}

function playerReadyReducer (state, {payload: {baseDataUrl, data}}) {
  const availableOptions = {};
  const {langOptions} = state.get('subtitles');
  (data.subtitles||[]).forEach(function (key) {
    const url = `${baseDataUrl}_${key}.srt`;
    const option = langOptions.find(option => option.value === key);
    availableOptions[key] = {key, url, ...option};
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

function playerSeekedReducer (state, action) {
  const {seekTo} = action;
  return state.update('subtitles', function (subtitles) {
    return updateCurrentItem(subtitles, seekTo);
  });
}

function playerTickReducer (state, {payload: {audioTime}}) {
  return state.update('subtitles', function (subtitles) {
    return updateCurrentItem(subtitles, audioTime);
  });
}

function subtitlesTextChangedReducer (state, {payload: {text}}) {
  return state.update('subtitles', function (subtitles) {
    const {selectedKey: key} = subtitles;
    return update(subtitles, {availableOptions: {[key]: {text: {$set: text}}}});
  });
}
