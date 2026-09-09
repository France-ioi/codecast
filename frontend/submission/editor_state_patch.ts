import {applyPatch as applyUnifiedDiff} from 'diff';

// A patch is a JSON array of operations that rebuilds a target string from a source string. It is
// read from left to right with a cursor placed at the beginning of the source:
//   a positive number   copies that many characters of the source and advances the cursor
//   a negative number   skips that many characters of the source
//   a string            inserts it, the cursor does not move
// Deleted text is stored as a length rather than as its characters, and unchanged text costs a
// number whatever its length, which is what keeps a patch small: a one character edit in the middle
// of a large state comes out as three operations. The patches are built by the task backend, this
// module only applies them, see its src/patch.ts.
//
// Lengths count UTF-16 code units, the unit of String.prototype.length, so the strings here are
// walked with the same semantics the backend used to measure them.

const legacyUnifiedDiffPrefix = 'Index:';

/**
 * Rebuilds a state from the one the patch was created from. Returns null when the patch is
 * malformed or does not fit the source, rather than a state rebuilt only in part: the caller then
 * stops walking the history back instead of showing the user a broken version.
 */
export function applyEditorStatePatch(source: string, patch: string): string|null {
    if (patch.startsWith(legacyUnifiedDiffPrefix)) {
        const target = applyUnifiedDiff(source, patch);

        return false === target ? null : target;
    }

    let operations: unknown;
    try {
        operations = JSON.parse(patch);
    } catch (error) {
        return null;
    }

    if (!Array.isArray(operations)) {
        return null;
    }

    let cursor = 0;
    let target = '';

    for (const operation of operations as unknown[]) {
        if ('string' === typeof operation) {
            target += operation;
            continue;
        }

        if ('number' !== typeof operation || !Number.isInteger(operation)) {
            return null;
        }

        const length = Math.abs(operation);
        if (cursor + length > source.length) {
            return null;
        }

        if (0 < operation) {
            target += source.substr(cursor, length);
        }
        cursor += length;
    }

    // Every character of the source is either copied or skipped, so a patch that leaves some of it
    // behind was not built from this source
    return cursor === source.length ? target : null;
}
