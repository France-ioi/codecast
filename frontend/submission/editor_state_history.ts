import diff from 'fast-diff';
import {
    EditorStateHistoryCache,
    EditorStateHistoryDescription,
    EditorStateHistoryElement,
    EditorStateHistoryOptions,
    EditorStateHistoryPatch,
    EditorStateHistoryTag,
    EditorStateTest,
} from '../task/task_types';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {applyEditorStatePatch} from './editor_state_patch';

// The history of the editor state, built from the chain of saves fetched from the task platform.
// The task platform only stores the states (as a chain of reverse patches from the newest one), the
// description of the history is defined here only. These functions are pure, the fetching is done
// by task_platform.ts.

export const editorStateHistoryInactivityDelay = 30 * 60 * 1000; // 30 min

// Why a save is a checkpoint, a save without tag is not one
export enum EditorStateHistoryTagIdentifier {
    LastSave = 'last_save',
    ActiveTabChange = 'active_tab_change',
    BeforeInactivity = 'before_inactivity',
}

export interface EditorStateSerializedSource {
    name: string,
    language: string,
    active: boolean,
    source: string[],
}

export interface EditorStateSerialized {
    sources: EditorStateSerializedSource[],
    tests: EditorStateTest[]|null,
}

/**
 * Describes the saves of the chain fetched so far that are not described yet, by rebuilding their
 * states. The task platform only stores the states, so that the description of the history is
 * defined here only. The states are rebuilt from the newest one down, a save being described with
 * the state of the save before it:
 *  - the saves made since the history was last described are walked from the newest state down to
 *    the first save already described;
 *  - the saves fetched since then are walked from the oldest state rebuilt so far.
 * A patch that does not apply cuts the chain: the saves before it can't be rebuilt, they are
 * dropped.
 */
export function describeEditorStateHistory(history: EditorStateHistoryCache): EditorStateHistoryCache {
    if (null === history.headState || !history.patches.length) {
        return history;
    }

    const descriptions = {...history.descriptions};
    let patches = history.patches;
    let complete = history.complete;
    let oldestRebuiltState = history.oldestRebuiltState;

    // Describes the saves from the one at this index, whose state is given, down to the oldest one
    // fetched, or up to the first save already described. Returns where it stopped
    const describeDown = (startIndex: number, startState: string, untilDescribed: boolean): {index: number, state: string}|null => {
        let index = startIndex;
        let serializedState = startState;
        let state = JSON.parse(serializedState) as EditorStateSerialized;
        while (true) {
            const patch = patches[index];
            if (untilDescribed && undefined !== descriptions[patch.id]) {
                return null;
            }

            const olderPatch = patches[index + 1];
            if (undefined === olderPatch) {
                // The first save has no save before it. The oldest save fetched otherwise waits for the
                // next page
                if (complete) {
                    descriptions[patch.id] = describeEditorStateChange(state, null);
                }

                return {index, state: serializedState};
            }

            const olderSerializedState = null !== olderPatch.patch ? applyEditorStatePatch(serializedState, olderPatch.patch) : null;
            if (null === olderSerializedState) {
                // The chain is broken: this save is the oldest one that can be rebuilt
                console.error(`The state of the save ${String(olderPatch.id)} of the editor cannot be rebuilt`);
                patches = patches.slice(0, index + 1);
                complete = true;
                descriptions[patch.id] = describeEditorStateChange(state, null);

                return {index, state: serializedState};
            }

            const olderState = JSON.parse(olderSerializedState) as EditorStateSerialized;
            descriptions[patch.id] = describeEditorStateChange(state, olderState);
            index++;
            serializedState = olderSerializedState;
            state = olderState;
        }
    };

    const oldestRebuiltIndex = null !== oldestRebuiltState ? patches.findIndex(patch => oldestRebuiltState.id === patch.id) : -1;
    if (-1 === oldestRebuiltIndex) {
        const end = describeDown(0, history.headState, false);
        oldestRebuiltState = {id: patches[end.index].id, state: end.state};
    } else {
        describeDown(0, history.headState, true);
        const end = describeDown(oldestRebuiltIndex, oldestRebuiltState.state, false);
        oldestRebuiltState = {id: patches[end.index].id, state: end.state};
    }

    return {
        ...history,
        patches,
        complete,
        descriptions,
        oldestRebuiltState,
    };
}

function describeEditorStateChange(state: EditorStateSerialized, previousState: EditorStateSerialized|null): EditorStateHistoryDescription {
    const activeSource = getActiveSerializedSource(state);
    const previousActiveSource = null !== previousState ? getActiveSerializedSource(previousState) : null;

    return {
        activeTab: null !== activeSource ? {
            name: activeSource.name,
            language: activeSource.language,
            length: getSerializedSourceLength(activeSource),
        } : null,
        activeTabChanged: null !== previousState
            && (null !== activeSource ? getSerializedSourceTabKey(activeSource) : null) !== (null !== previousActiveSource ? getSerializedSourceTabKey(previousActiveSource) : null),
        modificationDeltas: computeEditorStateModificationDeltas(previousState, state),
    };
}

function getActiveSerializedSource(state: EditorStateSerialized): EditorStateSerializedSource|null {
    return state.sources.find(source => source.active) ?? state.sources[0] ?? null;
}

// Characters for a text language, blocks for a block language, whose source is the Blockly XML
function getSerializedSourceLength(source: EditorStateSerializedSource): number {
    const code = source.source.join('\n');
    if (CodecastPlatform.Blockly === source.language || CodecastPlatform.Scratch === source.language) {
        return (code.match(/<block[\s>]/g) ?? []).length;
    }

    return code.length;
}

// The states hold no tab identifier: a tab is followed from a state to the next one by its name and
// its language, so renaming a tab, or changing its language, reads as another tab
function getSerializedSourceTabKey(source: EditorStateSerializedSource): string {
    return `${source.language}\n${source.name}`;
}

// Counts the characters of the code tabs added and removed from a state to the next one, the tests
// are not counted
function computeEditorStateModificationDeltas(previousState: EditorStateSerialized|null, state: EditorStateSerialized): {added: number, removed: number} {
    const previousSources = new Map((previousState?.sources ?? []).map(source => [getSerializedSourceTabKey(source), source]));
    let added = 0;
    let removed = 0;

    for (let source of state.sources) {
        const key = getSerializedSourceTabKey(source);
        const previousSource = previousSources.get(key);
        previousSources.delete(key);

        const code = source.source.join('\n');
        if (undefined === previousSource) {
            added += code.length;
            continue;
        }

        const previousCode = previousSource.source.join('\n');
        if (previousCode === code) {
            continue;
        }

        for (let [operation, text] of diff(previousCode, code)) {
            if (diff.INSERT === operation) {
                added += text.length;
            } else if (diff.DELETE === operation) {
                removed += text.length;
            }
        }
    }

    // The tabs left were removed
    for (let previousSource of previousSources.values()) {
        removed += previousSource.source.join('\n').length;
    }

    return {added, removed};
}

/**
 * Tells why a save is a checkpoint: it is the newest one, the user was on another tab at the save
 * before (switching tabs alone doesn't save, the switch is seen at the next save), or it is the last
 * one before a long inactivity.
 */
function getEditorStateHistoryTags(history: EditorStateHistoryCache, index: number): EditorStateHistoryTag[] {
    const patch = history.patches[index];
    const newerPatch = history.patches[index - 1];
    const tags: EditorStateHistoryTag[] = [];

    if (0 === index) {
        tags.push({identifier: EditorStateHistoryTagIdentifier.LastSave});
    }
    if (history.descriptions[patch.id]?.activeTabChanged) {
        tags.push({identifier: EditorStateHistoryTagIdentifier.ActiveTabChange});
    }
    if (undefined !== newerPatch && new Date(newerPatch.date).getTime() - new Date(patch.date).getTime() >= editorStateHistoryInactivityDelay) {
        tags.push({identifier: EditorStateHistoryTagIdentifier.BeforeInactivity});
    }

    return tags;
}

/**
 * Describes a page of the history, newest first, from the saves described so far. Returns null when
 * more saves must be fetched to fill it. The limit counts the elements returned: with
 * onlyCheckpoints, it counts the checkpoints, so the saves are fetched until that many checkpoints
 * are found, or until the start of the history. The checkpoint deltas of a checkpoint go back to the
 * previous checkpoint, so the saves are also fetched until the one before the last checkpoint
 * returned is found.
 * The language of the active tabs is left as Codecast names it (python, blockly...).
 */
export function selectEditorStateHistoryElements(history: EditorStateHistoryCache, options: EditorStateHistoryOptions): EditorStateHistoryElement[]|null {
    const limit = options.limit ?? 100;
    const maxId = options.maxId ?? null;
    const minId = options.minId ?? null;
    const isInRange = (patch: EditorStateHistoryPatch) => (null === maxId || patch.id <= maxId)
        && (null === minId || patch.id > minId);

    // Only the saves described so far can be listed, they go from the newest one down without gap
    const describedCount = history.patches.findIndex(patch => undefined === history.descriptions[patch.id]);
    const described = (-1 === describedCount ? history.patches : history.patches.slice(0, describedCount))
        .map((patch, index) => ({patch, index, tags: getEditorStateHistoryTags(history, index)}));
    const checkpoints = described.filter(({tags}) => 0 < tags.length);
    // Everything was fetched: the saves left, if any, can't be described (the chain has no state)
    const exhausted = history.complete;
    const oldestId = described.length ? described[described.length - 1].patch.id : null;
    const reachedMinId = null !== minId && null !== oldestId && oldestId <= minId + 1;

    const inRange = (options.onlyCheckpoints ? checkpoints : described).filter(({patch}) => isInRange(patch));
    const selected = inRange.slice(0, limit);
    const lastCheckpoint = selected.filter(({tags}) => 0 < tags.length).pop();
    const hasPreviousCheckpoint = undefined === lastCheckpoint || checkpoints.some(({patch}) => patch.id < lastCheckpoint.patch.id);
    if (!exhausted && !((inRange.length >= limit || reachedMinId) && hasPreviousCheckpoint)) {
        return null;
    }

    return selected.map(({index, tags}) => describeEditorStateHistoryElement(history, index, tags, checkpoints));
}

function getPatchDeltas(history: EditorStateHistoryCache, patch: EditorStateHistoryPatch): {added: number, removed: number} {
    return history.descriptions[patch.id]?.modificationDeltas ?? {added: 0, removed: 0};
}

// The deltas of a checkpoint add up those of the saves since the previous checkpoint, the states are
// not compared
function describeEditorStateHistoryCheckpointDeltas(history: EditorStateHistoryCache, checkpointId: number, checkpoints: {patch: EditorStateHistoryPatch}[]): EditorStateHistoryElement['checkpointsDeltas'] {
    const previousCheckpointId = checkpoints.find(({patch}) => patch.id < checkpointId)?.patch.id ?? 0;
    const patches = history.patches.filter(patch => patch.id > previousCheckpointId && patch.id <= checkpointId);

    return {
        added: patches.reduce((sum, patch) => sum + getPatchDeltas(history, patch).added, 0),
        removed: patches.reduce((sum, patch) => sum + getPatchDeltas(history, patch).removed, 0),
        elementsCount: patches.length - 1,
    };
}

function describeEditorStateHistoryElement(history: EditorStateHistoryCache, index: number, tags: EditorStateHistoryTag[], checkpoints: {patch: EditorStateHistoryPatch}[]): EditorStateHistoryElement {
    const patch = history.patches[index];
    const activeTab = history.descriptions[patch.id]?.activeTab ?? null;
    const isCheckpoint = 0 < tags.length;

    return {
        id: patch.id,
        datetime: patch.date,
        tags,
        idUser: patch.idUser,
        isCheckpoint,
        deltas: getPatchDeltas(history, patch),
        ...(isCheckpoint ? {checkpointsDeltas: describeEditorStateHistoryCheckpointDeltas(history, patch.id, checkpoints)} : {}),
        activeTab: null !== activeTab ? {
            name: activeTab.name,
            length: activeTab.length,
            progLang: activeTab.language,
        } : null,
    };
}

/**
 * Rebuilds the serialized state of a save, which must have been fetched. The patches are reverse
 * ones, so a state can only be rebuilt going down from a newer one: from the oldest state rebuilt
 * so far when the save is not newer than it (fewer patches to apply), from the newest state
 * otherwise.
 */
export function rebuildEditorStateHistoryState(history: EditorStateHistoryCache, elementId: number): string {
    const elementIndex = history.patches.findIndex(patch => elementId === patch.id);
    if (-1 === elementIndex || null === history.headState) {
        throw new Error(`No save of the editor state with this id: ${String(elementId)}`);
    }

    const startIndex = null !== history.oldestRebuiltState && history.oldestRebuiltState.id >= elementId
        ? history.patches.findIndex(patch => history.oldestRebuiltState.id === patch.id)
        : -1;
    let serializedState = -1 !== startIndex ? history.oldestRebuiltState.state : history.headState;
    for (let patch of history.patches.slice(Math.max(startIndex, 0) + 1, elementIndex + 1)) {
        serializedState = null !== patch.patch ? applyEditorStatePatch(serializedState, patch.patch) : null;
        if (null === serializedState) {
            throw new Error(`The state of the save ${String(patch.id)} cannot be rebuilt`);
        }
    }

    return serializedState;
}
