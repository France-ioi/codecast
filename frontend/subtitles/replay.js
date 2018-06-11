
import update from 'immutability-helper';

import {updateCurrentItem} from './utils';

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
