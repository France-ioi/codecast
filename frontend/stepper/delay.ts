import {delay} from 'redux-saga/effects';

export default function(bundle) {
    bundle.defer(function({stepperApi}) {
        stepperApi.addBuiltin('delay', function* delayBuiltin(stepperContext, millis) {
            function* delaySaga() {
                yield delay(millis.toInteger());
            }

            /* TODO: is there something to do during replay? */
            yield ['interact', {saga: delaySaga}];
        });
    });
}
