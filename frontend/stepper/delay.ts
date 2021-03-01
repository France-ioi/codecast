import {delay} from 'redux-saga/effects';
import {StepperContext} from "./api";
import {Bundle} from "../linker";
import {App} from "../index";

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.addBuiltin('delay', function* delayBuiltin(stepperContext: StepperContext, millis) {
            function* delaySaga() {
                yield delay(millis.toInteger());
            }

            yield ['interact', {saga: delaySaga}];
        });
    });
}
