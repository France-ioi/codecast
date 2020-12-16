import {Map} from 'immutable';

import saveScreenComponent from './save_screen';
import recorderStore from './store';
import recorderSagas from './sagas';
import MemoryUsageBundle from './memory_usage';
import VumeterBundle from './vumeter';
import ScreensBundle from '../common/screens';
import {ActionTypes as AppActionTypes} from "../actionTypes";
import produce from "immer";

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft) => {
        draft.recorder = {};
    }));

    bundle.include(saveScreenComponent);
    bundle.include(recorderStore);
    bundle.include(recorderSagas);
    bundle.include(MemoryUsageBundle);
    bundle.include(VumeterBundle);
    bundle.include(ScreensBundle);
};
