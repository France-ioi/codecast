import clickDrag from 'react-clickdrag';
import {ActionTypes} from "./actionTypes";
import {SubtitlesBand} from "./SubtitlesBand";

export default function (bundle) {

    bundle.defineAction(ActionTypes.SubtitlesBandBeginMove);
    bundle.addReducer(ActionTypes.SubtitlesBandBeginMove, subtitlesBandBeginMoveReducer);

    bundle.defineAction(ActionTypes.SubtitlesBandEndMove);
    bundle.addReducer(ActionTypes.SubtitlesBandEndMove, subtitlesBandEndMoveReducer);

    bundle.defineAction(ActionTypes.SubtitlesBandMoved);
    bundle.addReducer(ActionTypes.SubtitlesBandMoved, subtitlesBandMovedReducer);

    bundle.defineView('SubtitlesBand', SubtitlesBandSelector, clickDrag(SubtitlesBand, {touch: true}));
}

function subtitlesBandBeginMoveReducer(state, {payload: {y}}) {
    return state.update('subtitles', function (subtitles) {
        return {...subtitles, isMoving: true, startY: y};
    });
}

function subtitlesBandEndMoveReducer(state, _action) {
    return state.update('subtitles', function (subtitles) {
        return {...subtitles, isMoving: false};
    });
}

function subtitlesBandMovedReducer(state, {payload: {y}}) {
    return state.update('subtitles', function (subtitles) {
        return {...subtitles, offsetY: 10 - (y - subtitles.startY)};
    });
}

function SubtitlesBandSelector(state, props) {
    const {
        loaded, editing, bandEnabled,
        items, currentIndex, itemVisible, isMoving, offsetY
    } = state.get('subtitles');

    const item = items && items[currentIndex];
    const subtitleData = item && item.data;
    if (subtitleData && typeof subtitleData.text === 'undefined' || !loaded || (!editing && !bandEnabled)) {
        return {hidden: true};
    }

    let textHidden = false;

    const trim = state.getIn(['editor', 'trim']);
    if (trim && trim.intervals) {
        const interval = trim.intervals.get(subtitleData.start);
        if (interval && (interval.value.mute || interval.value.skip)) {
            if (interval.start <= subtitleData.start) {
                textHidden = true;
            }
        }
    }

    const geometry = state.get('mainViewGeometry');
    const windowHeight = state.get('windowHeight');
    const scope = state.get('scope');

    return {
        top: windowHeight - 60,
        active: itemVisible, item, isMoving, offsetY, geometry, windowHeight,
        beginMove: scope.subtitlesBandBeginMove,
        endMove: scope.subtitlesBandEndMove,
        doMove: scope.subtitlesBandMoved,
        textHidden
    };
}
