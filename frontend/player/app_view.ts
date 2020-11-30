import {PlayerApp} from "./PlayerApp";

function PlayerAppSelector(state, props) {
    const {PlayerControls, StepperView, SubtitlesBand} = state.get('scope');
    const viewportTooSmall = state.get('viewportTooSmall');
    const containerWidth = state.get('containerWidth');
    const player = state.get('player');
    const isReady = player.get('isReady');
    const progress = player.get('progress');
    const error = player.get('error');
    return {
        viewportTooSmall, containerWidth,
        PlayerControls, StepperView, SubtitlesBand,
        isReady, progress, error
    };
}

export default function (bundle) {
    bundle.defineView('PlayerApp', PlayerAppSelector, PlayerApp);
};
