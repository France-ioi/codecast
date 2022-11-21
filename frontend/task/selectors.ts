import {AppStoreReplay} from "../store";
import {getBufferModel} from "../buffers/selectors";
import log from 'loglevel';

export function selectAnswer(state: AppStoreReplay): any {
    const sourceModel = getBufferModel(state, 'source');
    log.getLogger('editor').debug('select old answer', sourceModel);

    return sourceModel ? sourceModel.document.getContent() : null;
}
