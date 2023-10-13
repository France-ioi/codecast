import {AppStoreReplay} from "../store";
import log from 'loglevel';
import {Document} from '../buffers/buffer_types';

export function selectAnswer(state: AppStoreReplay): Document|null {
    const activeBufferName = state.buffers.activeBufferName;
    const sourceModel = state.buffers.buffers[activeBufferName];
    // log.getLogger('editor').debug('select current answer', sourceModel ? sourceModel.document : null);

    return sourceModel ? sourceModel.document : null;
}
