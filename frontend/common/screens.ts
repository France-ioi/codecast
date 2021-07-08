import {ActionTypes} from "./actionTypes";
import {Bundle} from "../linker";

export enum Screen {
    Setup = 'setup',
    Edit = 'edit',
    Statistics = 'statistics',
    Record = 'record',
    Save = 'save',
    EditorSave = 'editor_save',
    Documentation = 'documentation',
}

export default function(bundle: Bundle) {
    // Switch to the specified screen.
    bundle.defineAction(ActionTypes.AppSwitchToScreen);

    bundle.addReducer(ActionTypes.AppSwitchToScreen, (state, {payload: {screen: screenName}}) => {
        state.screen = screenName;
    });
};
