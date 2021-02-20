import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.SubtitlesBandBeginMove);
    bundle.addReducer(ActionTypes.SubtitlesBandBeginMove, subtitlesBandBeginMoveReducer);

    bundle.defineAction(ActionTypes.SubtitlesBandEndMove);
    bundle.addReducer(ActionTypes.SubtitlesBandEndMove, subtitlesBandEndMoveReducer);

    bundle.defineAction(ActionTypes.SubtitlesBandMoved);
    bundle.addReducer(ActionTypes.SubtitlesBandMoved, subtitlesBandMovedReducer);
}

function subtitlesBandBeginMoveReducer(state: AppStore, {payload: {y}}): void {
    state.subtitles.isMoving = true;
    state.subtitles.startY = y;
}

function subtitlesBandEndMoveReducer(state: AppStore): void {
    state.subtitles.isMoving = false;
}

function subtitlesBandMovedReducer(state: AppStore, {payload: {y}}): void {
    state.subtitles.offsetY = 10 - (y - state.subtitles.startY);
}
