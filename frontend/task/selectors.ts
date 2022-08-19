import {AppStoreReplay} from "../store";
import {getBufferModel} from "../buffers/selectors";

export function selectAnswer(state: AppStoreReplay): any {
    const sourceModel = getBufferModel(state, 'source');
    console.log('select current answer', sourceModel ? sourceModel.document.getContent() : null);

    return sourceModel ? sourceModel.document.getContent() : null;
}
