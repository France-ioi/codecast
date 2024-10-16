import url from 'url';
import {stringifySync} from 'subtitle';
import {call, put, select, take, takeLatest} from 'typed-redux-saga';
import {RECORDING_FORMAT_VERSION} from '../version';
import {asyncRequestJson} from '../utils/api';
import {uploadBlobChannel} from '../utils/blobs';
import {CodecastWorker, spawnWorker} from '../utils/worker_utils';
// @ts-ignore
import AudioWorker from '../audio_worker/index.worker';
import {IntervalTree, TrimInterval} from './interval_tree';
import {findInstantIndex} from '../player/utils';
import {findSubtitleIndex} from '../subtitles/utils';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as SubtitlesActionTypes} from "../subtitles/actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";
import {Screen} from "../common/screens";
import {EditorSaveState, EditorSavingStep} from "./index";
import {subtitlesLoadForTrimSaga} from "../subtitles/loading";
import {UploadResponse} from "../recorder/save_screen";
import {appSelect} from '../hooks';

export const initialStateTrimSaving = {
    unsaved: false,
    intervals: null as IntervalTree,
}

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.EditorTrimEnter);
    bundle.defineAction(ActionTypes.EditorTrimReturn);

    bundle.defineAction(ActionTypes.EditorTrimSave);
    bundle.addReducer(ActionTypes.EditorTrimSave, editorTrimSaveReducer);

    bundle.defineAction(ActionTypes.EditorTrimMarkerAdded);
    bundle.addReducer(ActionTypes.EditorTrimMarkerAdded, trimEditorMarkerAddedReducer);

    bundle.defineAction(ActionTypes.EditorTrimMarkerRemoved);
    bundle.addReducer(ActionTypes.EditorTrimMarkerRemoved, trimEditorMarkerRemovedReducer);

    bundle.defineAction(ActionTypes.EditorTrimIntervalChanged);
    bundle.addReducer(ActionTypes.EditorTrimIntervalChanged, trimEditorIntervalChangedReducer);

    bundle.addSaga(trimSaga);

    bundle.defineAction(ActionTypes.EditorSavingStep);
    bundle.addReducer(ActionTypes.EditorSavingStep, (state: AppStore, {payload: {step, status, progress, error}}) => {
        if (step !== undefined) {
            state.editor.save.step = step;
        }
        if (typeof progress === 'number') {
            state.editor.save.progress = progress;
        }
        if (error !== undefined) {
            state.editor.save.error = error;
        }
    });
};

function editorTrimSaveReducer(state: AppStore): void {
    state.editor.save.state = EditorSaveState.Pending;
}

function trimEditorMarkerAddedReducer(state: AppStore, {payload: {position}}): void {
    state.editor.trim.intervals = state.editor.trim.intervals.split(position);
}

function trimEditorMarkerRemovedReducer(state: AppStore, {payload: {position}}) {
    state.editor.trim.intervals = state.editor.trim.intervals.mergeLeft(position);
}

function trimEditorIntervalChangedReducer(state: AppStore, {payload: {position, value}}): void {
    /* TODO: update instants in the player, to add/remove jump at position */
    let {intervals} = state.editor.trim;
    intervals = intervals.set(position, value);
    let instants = state.player.instants;
    instants = addJumpInstants(instants, intervals);

    state.editor.trim.intervals = intervals;
    state.editor.trim.unsaved = true;
    state.player.instants = instants;
}

function addJumpInstants(instants, intervals) {
    /* Clear existing annotations (also copy the Array we will mutate). */
    instants = instants.filter(instant => instant.event);

    let skip = false, skipStart;
    for (let interval of intervals) {
        const mute = interval.value.mute;

        insertAnnotation(Math.max(1, interval.start), {mute});

        if (skip !== interval.value.skip) {
            if (!skip) {
                skipStart = Math.max(1, interval.start);
            } else {
                /* At jump target. */
                insertAnnotation(skipStart, {jump: interval.start, mute});
            }

            skip = interval.value.skip;
        }
    }
    if (skip) {
        insertAnnotation(skipStart, {jump: instants[instants.length - 1].t})
    }

    return instants;

    function insertAnnotation(t, data) {
        let index = findInstantIndex(instants, t);

        /* Insert an annotation at the requested position, if necessary. */
        if (instants[index].t < t || instants[index].event) {
            const state = instants[index].state;
            index += 1;
            instants.splice(index, 0, {t, state});
        }

        instants[index] = {...instants[index], ...data};
    }
}

function* trimSaga() {
    yield* takeLatest(ActionTypes.EditorTrimEnter, editorTrimEnterSaga);
    yield* takeLatest(ActionTypes.EditorTrimReturn, editorTrimReturnSaga);
    yield* takeLatest(ActionTypes.EditorTrimSave, editorTrimSaveSaga);
}

function* editorTrimEnterSaga(_action) {
    /* XXX install return button */
    yield* put({
        type: ActionTypes.EditorControlsChanged,
        payload: {
            controls: 'trim'
        }
    });

    yield* put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Edit}});
}

function* editorTrimReturnSaga(_action) {
    yield* put({type: ActionTypes.EditorControlsChanged, payload: {controls: 'none'}});
    yield* put({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.Setup}});
}

function* editorTrimSaveSaga(action) {
    try {
        let state: AppStore = yield* appSelect();
        const editor = state.editor;
        const {intervals} = editor.trim;
        const {targets, playerUrl, editorUrl} = yield* call(trimEditorPrepareUpload, action.payload.target);

        const data = editor.data;
        const eventsBlob = trimEvents(data, intervals);

        yield* call(trimEditorUpload, EditorSavingStep.UploadEvents, targets.events, eventsBlob);

        const audioBuffer = editor.audioBuffer;
        const worker = yield* call(trimEditorAssembleAudio, audioBuffer, intervals);
        const mp3Blob = yield* call(trimEditorEncodeAudio, worker);

        yield* call(trimEditorUpload, EditorSavingStep.UploadAudio, targets.audio, mp3Blob);

        yield* call(subtitlesLoadForTrimSaga);
        const subtitles = yield* call(trimEditorUpdateSubtitles, intervals);
        if (!subtitles) {
            return;
        }

        yield* call(trimSubtitleUpload, playerUrl, subtitles);
        yield* put({type: ActionTypes.EditorSaveSucceeded, payload: {playerUrl, editorUrl}});
    } catch (ex) {
        console.error('failed', ex);
        yield* put({type: ActionTypes.EditorSaveFailed, payload: {error: ex}});
    }
}

function trimEvents(data, intervals: IntervalTree) {
    const it = intervals[Symbol.iterator]();
    let start = 0;
    const endTime = data.events[data.events.length - 1][0];
    let interval: TrimInterval = {start: -1, end: -1, value: {skip: true, mute: false}};
    const events = [];
    let end = false;
    for (let event of data.events) {
        // Advance to the interval containing this event
        while (event[0] >= interval.end) {
            /* Advance start time if past interval was not skipped. */
            if (!interval.value.skip) {
                start += interval.end - interval.start;
            }
            const nextIterator = it.next();
            interval = nextIterator.value;
            /* Truncate the events if we get to the last interval and it is skipped. */
            if (nextIterator.done || interval.value.skip && interval.end >= endTime) {
                events.push([interval.start, 'end']);
                end = true;
                break;
            }
        }
        if (end) {
            break;
        }

        const transformedEvent = [...event];
        if (interval.value.skip) {
            transformedEvent[0] = start;
        } else {
            transformedEvent[0] = start + (event[0] - interval.start);
        }

        events.push(transformedEvent);
    }

    const options = data.options;

    return new Blob([JSON.stringify({
        ...data,
        version: RECORDING_FORMAT_VERSION,
        options,
        events,
        subtitles: [],
    })], {
        type: "application/json;charset=UTF-8"
    });
}

function trimSubtitles(data, intervals) {
    function updateSubtitle(items, intervals) {
        if (!items.length) {
            return stringifySync([], {
                format: "SRT"
            });
        }

        const last = items[items.length - 1].data.end;
        let start = items[0].data.start;
        let timeSkipped = 0;
        const outItems = [];
        const _posData = {start: -1, isContained: false, startIndex: -1, endIndex: 0, end: 0};

        function getIntervalItemData(items, interval) {
            _posData.start = _posData.end;
            _posData.startIndex = interval.start !== items[_posData.start].data.start ? _posData.start + 1 : _posData.start;
            _posData.isContained = (interval.end <= items[_posData.start].data.end);

            if (_posData.isContained) {
                _posData.end = _posData.start;
            } else {
                _posData.end = findSubtitleIndex(items, interval.end);
            }
            _posData.endIndex = interval.end === items[_posData.end].data.start ? _posData.end - 1 : _posData.end;

            return _posData;
        }

        while (start + 1 < last) {
            const interval = intervals.get(start + 1);
            const selectedItems = getIntervalItemData(items, interval);

            // clean out skip/mute items
            if (interval.value.skip) {
                if (selectedItems.isContained) {
                    if (outItems.length) {
                        outItems[outItems.length - 1].data.end -= (interval.end - interval.start);
                    }
                    timeSkipped += (interval.end - interval.start);
                } else {
                    const itemStartIndex = (interval.start - timeSkipped);
                    if (outItems.length) {
                        outItems[outItems.length - 1].data.end = itemStartIndex;
                    }

                    if (interval.end !== Infinity) {
                        timeSkipped += (interval.end - interval.start);

                        outItems.push({
                            data: {
                                start: itemStartIndex,
                                end: items[selectedItems.endIndex].data.end - timeSkipped
                            },
                            type: "cue"
                        });
                    }
                }
            } else if (interval.value.mute && !selectedItems.isContained) {
                if (outItems.length) {
                    outItems[outItems.length - 1].data.end = (items[selectedItems.endIndex].data.end - timeSkipped);
                }
            } else {
                if (timeSkipped !== 0) {
                    // update skipoffset for all items in the interval,
                    // not just the items that start inside of it
                    for (let i = (selectedItems.isContained) ? selectedItems.start : selectedItems.startIndex; i <= selectedItems.endIndex; i++) {
                        outItems.push({
                            ...items[i],
                            data: {
                                ...items[i].data,
                                start: items[i].data.start - timeSkipped,
                                end: items[i].data.end - timeSkipped
                            }
                        });
                    }
                } else {
                    if (selectedItems.start === 0) {
                        for (let i = selectedItems.start; i <= selectedItems.endIndex; i++) {
                            outItems.push({
                                ...items[i]
                            });
                        }
                    } else {
                        for (let i = selectedItems.startIndex; i <= selectedItems.endIndex; i++) {
                            outItems.push({
                                ...items[i]
                            });
                        }
                    }
                }
            }

            start = interval.end;
        }

        return stringifySync(outItems, {
            format: "SRT"
        });
    }

    return data.map(({key, items}) => ({key, removed: false, text: updateSubtitle(items, intervals)}));
}

function* trimEditorUpdateSubtitles(intervals) {
    const step = EditorSavingStep.UpdateSubtitles;

    try {
        yield* put({type: ActionTypes.EditorSavingStep, payload: {step}});

        const state = yield* appSelect();
        const {loaded: subtitleData} = state.subtitles.trim;
        const subtitles = trimSubtitles(subtitleData, intervals); // return [{key, text}]

        yield* put({type: SubtitlesActionTypes.SubtitlesTrimDone, payload: {subtitles}});
        yield* put({type: ActionTypes.EditorSavingStep, payload: {step, progress: 100}});
        yield* put({type: ActionTypes.EditorSavingStep, payload: {step}});

        return subtitles;
    } catch (error) {
        console.error('Subtitles Trim Error:', error);

        yield* put({type: ActionTypes.EditorSavingStep, payload: {step, status: EditorSaveState.Failure, error: error.toString()}});
    }
}

function* trimEditorPrepareUpload(target) {
    yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.PrepareUpload}});

    const state = yield* appSelect();
    const {baseUrl} = state.options;
    const uploadParameters = {
        ...target,
        basePlayerUrl: window.location.href.split('?')[0],
    };
    const targets: UploadResponse = (yield* call(asyncRequestJson, `${baseUrl}/upload`, uploadParameters)) as UploadResponse;
    yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.PrepareUpload}});

    return {targets, playerUrl: targets.player_url, editorUrl: targets.editor_url}; // XXX clean up /upload endpoint interface
}

function* trimEditorUpload(step, target, data) {
    yield* put({type: ActionTypes.EditorSavingStep, payload: {step}});
    const channel = yield* call(uploadBlobChannel, target, data);

    while (true) {
        const event = yield* take(channel);
        if (!event) break;
        switch (event.type) {
            case 'response':
                yield* put({type: ActionTypes.EditorSavingStep, payload: {step}});
                channel.close();
                return event.response;
            case 'error':
                yield* put({type: ActionTypes.EditorSavingStep, payload: {step, status: EditorSaveState.Failure, error: event.error}});
                break;
            case 'progress':
                yield* put({type: ActionTypes.EditorSavingStep, payload: {step, progress: event.percent / 100}});
                break;
        }
    }

    yield* put({type: ActionTypes.EditorSavingStep, payload: {step, status: EditorSaveState.Failure, error: 'unexpected end'}});
}

function* trimEditorAssembleAudio(audioBuffer, intervals) {
    yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.AssembleAudio}});
    const state = yield* appSelect();
    const worker = yield* call(spawnWorker, AudioWorker, state.options.audioWorkerUrl);
    const {sampleRate, numberOfChannels, duration} = audioBuffer;

    /* Extract the list of chunks to retain. */
    const chunks = [];
    let length = 0;
    for (let it of intervals) {
        let {skip, mute} = it.value;
        if (!skip) {
            const sourceStart = Math.round(it.start / 1000 * sampleRate);
            const sourceEnd = Math.round(Math.min(it.end / 1000, duration) * sampleRate);
            const chunkLength = sourceEnd - sourceStart;

            chunks.push({start: sourceStart, length: chunkLength, mute});  // add muted flag here
            length += chunkLength;
        }
    }

    yield* call(worker.call, 'init', {sampleRate, numberOfChannels});

    let addedLength = 0;
    for (let chunk of chunks) {
        let samples = [];
        for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber += 1) {
            const chunkBuffer = new Float32Array(chunk.length);
            if (!chunk.mute) {
                audioBuffer.copyFromChannel(chunkBuffer, channelNumber, chunk.start);
            }
            samples.push(chunkBuffer);
        }
        addedLength += chunk.length;

        yield* call(worker.call, 'addSamples', {samples});
        yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.AssembleAudio, progress: addedLength / length}});
    }

    yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.AssembleAudio}});

    return worker;
}

function* trimEditorEncodeAudio(worker: CodecastWorker) {
    const step = EditorSavingStep.EncodeAudio;
    yield* put({type: ActionTypes.EditorSavingStep, payload: {step}});

    const {mp3: mp3Blob}: any = yield* call(worker.call, 'export', {mp3: true}, function* ({progress}) {
        yield* put({type: ActionTypes.EditorSavingStep, payload: {step, progress}});
    });
    yield* put({type: ActionTypes.EditorSavingStep, payload: {step}});

    return mp3Blob;
}

function* trimSubtitleUpload(playerUrl, subtitles) {
    yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.UploadSubtitles}});

    const state = yield* appSelect();
    const {baseUrl} = state.options;
    const urlParsed = url.parse(playerUrl, true);
    const base = urlParsed.query['recording']; //newly generated codecast's base
    const editor = state.editor;
    const {name} = editor.data;
    const changes = {name, subtitles};

    try {
        yield* call(asyncRequestJson, `${baseUrl}/save`, {base, changes});

        yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.UploadSubtitles, progress: 100}});
        yield* put({type: ActionTypes.EditorSavingStep, payload: {step: EditorSavingStep.UploadSubtitles}});
    } catch (ex) {
        yield* put({
            type: ActionTypes.EditorSavingStep,
            payload: {step: EditorSavingStep.UploadSubtitles, status: EditorSaveState.Failure, error: ex.toString()}
        });
    }
}
