import {delay} from 'typed-redux-saga';
import {StepperContext} from "./api";
import {Bundle} from "../linker";

import {App} from '../app_types';

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.addBuiltin('delay', function* delayBuiltin(stepperContext: StepperContext, millis) {
            function* delaySaga() {
                yield* delay(millis.toInteger());
            }

            yield ['interact', {saga: delaySaga}];
        });
    });
}
