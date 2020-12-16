import {ActionTypes} from "./actionTypes";
import produce from "immer";

type Screen = 'setup' | 'edit';

export const initialStateScreen: Screen = 'setup';

export default function(bundle) {
    // Switch to the specified screen.
    bundle.defineAction(ActionTypes.SystemSwitchToScreen);

    bundle.addReducer(ActionTypes.SystemSwitchToScreen, produce((draft, {payload: screen}) => {
        draft.screen = screen;
    }));
};
