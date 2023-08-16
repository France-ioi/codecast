import loadingBundle from './loading';
import paneBundle from './pane';
import bandBundle from './band';
import replayBundle from './replay';
import editorBundle from './editor';
import {getPersistentOptions, setPersistentOption} from './options';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {NodeCue} from "subtitle";

export type SubtitlesOption = {
    key?: string,
    text?: string,
    unsaved?: boolean,
    countryCode: string,
    label: string,
    value: string,
    removed?: boolean,
    url?: string
}

export type SubtitlesOptions = {
    [key: string]: SubtitlesOption
}

export interface SubtitlesState {
    langOptions: SubtitlesOption[],
    editing: boolean,
    paneEnabled: boolean,
    bandEnabled: boolean,
    /* player-specific */
    filterText: string,
    filterRegexp: any,
    /* editor-specific */
    trim: {
        loaded: any[],
    },
    text: string,
    items: NodeCue[],
    currentIndex: number,
    audioTime: number,
    loaded: boolean,
    itemVisible: boolean,
    isMoving: boolean,
    startY: number,
    offsetY: number,
    unsaved: boolean,
    availableOptions: SubtitlesOptions,
    selectedKey: number,
    filteredItems: any[],
    loadedKey: string,
    lastError: string,
    loading: boolean,
}

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        const {paneEnabled, bandEnabled} = getPersistentOptions();

        state.subtitles = {
            langOptions: [
                {value: 'fr-FR', label: "Français", countryCode: 'fr'},
                {value: 'en-US', label: "English", countryCode: 'us'},
                {value: 'nl-NL', label: "Nederlands", countryCode: 'nl'},
            ],
            editing: false,
            paneEnabled: false,
            bandEnabled: false,
            /* player-specific */
            filterText: '',
            filterRegexp: null,
            /* editor-specific */
            trim: {
                loaded: [],
            },
            text: '',
            items: [] as NodeCue[],
            currentIndex: 0,
            audioTime: 0,
            loaded: false,
            itemVisible: false,
            isMoving: false,
            startY: 0,
            offsetY: 0,
            unsaved: false,
            availableOptions: {} as SubtitlesOptions,
            selectedKey: 0,
            filteredItems: [],
            loadedKey: 'none',
            lastError: '',
            loading: false
        };
        state.subtitles.paneEnabled = paneEnabled;
        state.subtitles.bandEnabled = bandEnabled;
    });

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

function subtitlesEditingChangedReducer(state: AppStore, {payload: {editing}}): void {
    state.subtitles.editing = editing;

    updateSubtitlesPaneVisibility(state);
}

function subtitlesPaneEnabledChangedReducer(state: AppStore, {payload: {value}}): void {
    state.subtitles.paneEnabled = value;

    updateSubtitlesPaneVisibility(state);

    setPersistentOption('paneEnabled', value);
}

function updateSubtitlesPaneVisibility(state: AppStore) {
    const {editing, loading, loadedKey, paneEnabled} = state.subtitles;
    const isLoaded = !loading && loadedKey !== 'none';

    /* Editor: the subtitles editor pane is always visible.
       Player: the subtitles pane is visible if subtitles are loaded,
               and if the pane is enabled in the CC settings. */
    const enabled = editing || (isLoaded && paneEnabled);
    const width = 200;

    let view = (editing) ? 'editor' : 'subtitles';

    state.panes['subtitles'] = {
        view,
        editing,
        enabled,
        width,
        visible: false
    };
}

function subtitlesBandEnabledChangedReducer(state: AppStore, {payload: {value}}): void {
    setPersistentOption('bandEnabled', value);

    state.subtitles.bandEnabled = value;
}
