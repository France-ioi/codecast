import saveScreenComponent from './save_screen';
import recorderStore from './store';
import recorderSagas from './sagas';
import MemoryUsageBundle from './memory_usage';
import VumeterBundle from './vu_meter';
import ScreensBundle from '../common/screens';
import {ActionTypes as AppActionTypes} from "../actionTypes";
import {Bundle} from "../linker";
import {App} from "../index";
import taskSlice, {taskRecordableActions} from "../task/task_slice";
import {call} from "redux-saga/effects";
import {ReplayContext} from "../player/sagas";

export default function(bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state) => {
        state.recorder = {};
    });

    bundle.include(saveScreenComponent);
    bundle.include(recorderStore);
    bundle.include(recorderSagas);
    bundle.include(MemoryUsageBundle);
    bundle.include(VumeterBundle);
    bundle.include(ScreensBundle);

    /* We can register actions that are simply recorded with all their parameters.
       WARNING: this should NOT apply to every action. To minimize the JSON output,
       we should record only the delta between the previous state and the next state.
       Some actions are compatible with this, some not. */
    bundle.defer(function({recordApi, replayApi}: App) {
        const recordableActions = {
            [taskSlice.name]: {
                actionNames: taskRecordableActions,
                actions: taskSlice.actions,
                reducers: taskSlice.caseReducers,
            },
        };

        for (let [sliceName, {actions, actionNames, reducers}] of Object.entries(recordableActions)) {
            for (let actionName of actionNames) {
                const action = actions[actionName];
                recordApi.on(action.type, function* (addEvent, {payload}) {
                    yield call(addEvent, action.type, payload);
                });
                replayApi.on(action.type, function (replayContext: ReplayContext, event) {
                    const payload = event[2];
                    const reducer = reducers[actionName];

                    reducer(replayContext.state[sliceName], action(payload));
                });
            }
        }
    });
};
