import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore} from "../store";

export default function(bundle) {
    bundle.defineAction(ActionTypes.SubtitlesBandBeginMove);
    bundle.addReducer(ActionTypes.SubtitlesBandBeginMove, produce(subtitlesBandBeginMoveReducer));

    bundle.defineAction(ActionTypes.SubtitlesBandEndMove);
    bundle.addReducer(ActionTypes.SubtitlesBandEndMove, produce(subtitlesBandEndMoveReducer));

    bundle.defineAction(ActionTypes.SubtitlesBandMoved);
    bundle.addReducer(ActionTypes.SubtitlesBandMoved, produce(subtitlesBandMovedReducer));
}

function subtitlesBandBeginMoveReducer(draft: AppStore, {payload: {y}}): void {
    draft.subtitles.isMoving = true;
    draft.subtitles.startY = y;
}

function subtitlesBandEndMoveReducer(draft: AppStore): void {
    draft.subtitles.isMoving = false;
}

function subtitlesBandMovedReducer(draft: AppStore, {payload: {y}}): void {
    draft.subtitles.offsetY = 10 - (y - draft.subtitles.startY);
}
