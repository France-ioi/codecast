import Immutable from 'immutable';

import menuBundle from './menu';
import loadingBundle from './loading';
import paneBundle from './pane';
import bandBundle from './band';
import replayBundle from './replay';
import editorBundle from './editor';
import {getPersistentOptions, setPersistentOption} from './options';
import {ActionTypes} from "./actionTypes";

export default function (bundle) {
  bundle.addReducer('init', initReducer);

  bundle.include(menuBundle);
  bundle.include(loadingBundle);
  bundle.include(paneBundle);
  bundle.include(bandBundle);
  bundle.include(replayBundle);
  bundle.include(editorBundle);

  bundle.defineAction(ActionTypes.SubtitlesEditingChanged);
  bundle.addReducer(ActionTypes.SubtitlesEditingChanged, subtitlesEditingChangedReducer);

  bundle.defineAction(ActionTypes.SubtitlesPaneEnabledChanged);
  bundle.addReducer(ActionTypes.SubtitlesPaneEnabledChanged, subtitlesPaneEnabledChangedReducer);

  bundle.defineAction(ActionTypes.SubtitlesBandEnabledChanged);
  bundle.addReducer(ActionTypes.SubtitlesBandEnabledChanged, subtitlesBandEnabledChangedReducer);

}

function initReducer (state, action) {
  const {paneEnabled, bandEnabled} = getPersistentOptions();
  return state
    .set('subtitles', {
      langOptions: [
        {value: 'fr-FR', label: "Français", countryCode: 'fr'},
        {value: 'en-US', label: "English",  countryCode: 'us'},
      ],
      editing: false,
      paneEnabled,
      bandEnabled,
      /* player-specific */
      filterText: '',
      filterRegexp: null,
      /* editor-specific */
      notify: {},
      trim: {
        loaded: [],
      },
    });
}

function subtitlesEditingChangedReducer (state, {payload: {editing}}) {
  state = state.update('subtitles', subtitles => ({...subtitles, editing}));
  state = updateSubtitlesPaneVisibility(state);

  return state;
}

function subtitlesPaneEnabledChangedReducer (state, {payload: {value}}) {
  state = state.update('subtitles', subtitles => ({...subtitles, paneEnabled: value}));
  state = updateSubtitlesPaneVisibility(state);
  setPersistentOption('paneEnabled', value);

  return state;
}

function updateSubtitlesPaneVisibility (state) {
  const {editing, loading, loadedKey, paneEnabled} = state.get('subtitles');
  const isLoaded = !loading && loadedKey !== 'none';

  /* Editor: the subtitles editor pane is always visible.
     Player: the subtitles pane is visible if subtitles are loaded,
             and if the pane is enabled in the CC settings. */
  const enabled = editing || (isLoaded && paneEnabled);
  const View = state.get('scope')[editing ? 'SubtitlesEditorPane' : 'SubtitlesPane'];
  const width = 200;

  return state.setIn(['panes', 'subtitles'], Immutable.Map({View, enabled, width}));
}

function subtitlesBandEnabledChangedReducer (state, {payload: {value}}) {
  setPersistentOption('bandEnabled', value);

  return state.update('subtitles', subtitles => ({...subtitles, bandEnabled: value}));
}
