import {AppStoreReplay} from "../store";
import {getBufferModel} from "../buffers/selectors";

export function selectAnswer(state: AppStoreReplay): any {
    const sourceModel = getBufferModel(state, 'source');
    console.log('select old answer', sourceModel);

    return sourceModel ? sourceModel.document.getContent() : null;
}
