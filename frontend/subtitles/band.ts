import clickDrag from 'react-clickdrag';
import {ActionTypes} from "./actionTypes";
import {SubtitlesBand} from "./SubtitlesBand";

export default function(bundle) {

    bundle.defineAction(ActionTypes.SubtitlesBandBeginMove);
    bundle.addReducer(ActionTypes.SubtitlesBandBeginMove, subtitlesBandBeginMoveReducer);

    bundle.defineAction(ActionTypes.SubtitlesBandEndMove);
    bundle.addReducer(ActionTypes.SubtitlesBandEndMove, subtitlesBandEndMoveReducer);

    bundle.defineAction(ActionTypes.SubtitlesBandMoved);
    bundle.addReducer(ActionTypes.SubtitlesBandMoved, subtitlesBandMovedReducer);
}

function subtitlesBandBeginMoveReducer(state, {payload: {y}}) {
    return state.update('subtitles', function(subtitles) {
        return {...subtitles, isMoving: true, startY: y};
    });
}

function subtitlesBandEndMoveReducer(state, _action) {
    return state.update('subtitles', function(subtitles) {
        return {...subtitles, isMoving: false};
    });
}

function subtitlesBandMovedReducer(state, {payload: {y}}) {
    return state.update('subtitles', function(subtitles) {
        return {...subtitles, offsetY: 10 - (y - subtitles.startY)};
    });
}
