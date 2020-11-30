import {ActionTypes} from "./actionTypes";

export default function (bundle, deps) {
    // Switch to the specified screen.
    bundle.defineAction(ActionTypes.SystemSwitchToScreen);

    bundle.addReducer(ActionTypes.SystemSwitchToScreen, function (state, {payload}) {
        return state.set('screen', payload.screen);
    });
};
