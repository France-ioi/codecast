import {Map} from 'immutable';

export default function (bundle, deps) {

    bundle.use('stepperExit', 'stepperStackUp', 'stepperStackDown', 'getCurrentStepperState');

    bundle.defer(function ({stepperApi}) {
        stepperApi.onInit(function (state) {
            state.controls = Map({
                stack: Map({focusDepth: 0})
            });
        });
    });
};
