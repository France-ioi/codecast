import {ActionTypes} from "./actionTypes";
import {Bundle} from "../linker";

type Screen = 'setup' | 'edit' | 'statistics';

export const initialStateScreen: Screen = 'setup';

export default function(bundle: Bundle) {
    // Switch to the specified screen.
    bundle.defineAction(ActionTypes.AppSwitchToScreen);

    bundle.addReducer(ActionTypes.AppSwitchToScreen, (state, {payload: {screen: screenName}}) => {
        state.screen = screenName;
    });
};
