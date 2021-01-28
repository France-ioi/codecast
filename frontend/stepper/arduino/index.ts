/*

Constants (until microcontroller hardware is configurable):
- PortDefns[portNumber] → {index, label, digital, analog}

In the global state:
- globalState.get('arduino').ports[portNumber] →
    {peripheral: {type, …}}

In the stepper state:
- stepperState.ports[portNumber] →
    {direction, output, input}

*/

import range from 'node-range';
import update from 'immutability-helper';
import {call, put, select} from 'redux-saga/effects';
import * as C from 'persistent-c';

import './ace';
import './style.scss';
import {ActionTypes} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../../actionTypes";
import {NPorts} from "./config";
import produce from "immer";
import {AppStore} from "../../store";
import {PlayerInstant} from "../../player/reducers";

export enum PinMode {
  PINMODE_INPUT = 0,
  PINMODE_OUTPUT = 1,
  PINMODE_INPUT_PULLUP = 2
}

export const initialStateArduino = {
    hardware: 'atmega328p',
    ports: range(0, NPorts - 1).map(_ => {
        return {peripheral: {type: 'none'}};
    })
};

export default function(bundle) {
    bundle.addReducer(AppActionTypes.AppInit, produce((draft: AppStore) => {
        draft.arduino = initialStateArduino;
    }));

    bundle.defineAction(ActionTypes.ArduinoReset);
    bundle.addReducer(ActionTypes.ArduinoReset, produce((draft: AppStore) => {
        draft.arduino = initialStateArduino;
    }));

    bundle.defineAction(ActionTypes.ArduinoPortConfigured);
    bundle.addReducer(ActionTypes.ArduinoPortConfigured, produce(arduinoPortConfiguredReducer));

    function arduinoPortConfiguredReducer(draft: AppStore, action): void {
        const {index, changes} = action;

        draft.arduino.ports[index] = changes;
    }

    bundle.defineAction(ActionTypes.ArduinoPortChanged);
    bundle.addReducer(ActionTypes.ArduinoPortChanged, produce(arduinoPortChangedReducer));

    function arduinoPortChangedReducer(draft: AppStore, action): void {
        const {index, changes} = action;

        draft.stepper.currentStepperState.ports[index] = changes;
    }

    bundle.defineAction(ActionTypes.ArduinoPortSelected);
    bundle.addReducer(ActionTypes.ArduinoPortSelected, produce(arduinoPortSelectedReducer));

    function arduinoPortSelectedReducer(draft: AppStore, action): void {
        const {index} = action;

        draft.stepper.currentStepperState.selectedPort = index;
    }

    bundle.defer(function({recordApi, replayApi, stepperApi}) {
        recordApi.onStart(function* (init) {
            const state: AppStore = yield select();
            const {platform} = state.options;
            if (platform === 'arduino') {
                init.arduino = state.arduino;
            }
        });
        replayApi.on('start', function(replayContext, event) {
            const {arduino} = event[2];
            if (arduino) {
                replayContext.state.arduino = arduino;
            }
        });
        replayApi.onReset(function* (instant: PlayerInstant) {
            const arduinoState = instant.state.arduino;
            if (arduinoState) {
                yield put({type: ActionTypes.ArduinoReset, state: arduinoState});
            }
        });

        recordApi.on(ActionTypes.ArduinoPortConfigured, function* (addEvent, action) {
            const {index, changes} = action;

            yield call(addEvent, 'arduino.port.configured', index, changes);
        });
        replayApi.on('arduino.port.configured', function(replayContext, event) {
            const index = event[2];
            const changes = event[3];

            replayContext.state = produce(arduinoPortConfiguredReducer.bind(replayContext.state, {index, changes}));
        });

        recordApi.on(ActionTypes.ArduinoPortChanged, function* (addEvent, action) {
            const {index, changes} = action;

            yield call(addEvent, 'arduino.port.changed', index, changes);
        });
        replayApi.on('arduino.port.changed', function(replayContext, event) {
            const index = event[2];
            const changes = event[3];

            replayContext.state = produce(arduinoPortChangedReducer.bind(replayContext.state, {index, changes}));
        });

        recordApi.on(ActionTypes.ArduinoPortSelected, function* (addEvent, action) {
            const {index} = action;

            yield call(addEvent, 'arduino.port.selected', index);
        });
        replayApi.on('arduino.port.selected', function(replayContext, event) {
            const index = event[2];

            replayContext.state = produce(arduinoPortSelectedReducer.bind(replayContext.state, {index}));
        });

        stepperApi.onInit(function(stepperState, state: AppStore) {
            const arduinoState = state.arduino;
            if (arduinoState) {
                stepperState.ports = range(0, NPorts - 1).map(function(index) {
                    /* Copy peripheral config on stepper init. */
                    const {peripheral} = arduinoState.ports[index];

                    return {direction: 0, output: 0, input: 0, peripheral};
                });

                stepperState.serial = {
                    speed: false
                };
            }
        });

        stepperApi.addBuiltin('pinMode', function* pinModeBuiltin(stepperContext, pin, mode) {
            yield ['pinMode', pin.toInteger(), mode.toInteger()];
        });
        stepperApi.onEffect('pinMode', function* pinModeEffect(stepperContext, pin, mode) {
            let {direction, output} = stepperContext.state.ports[pin];
            switch (mode) {
                case PinMode.PINMODE_INPUT:
                    direction = 0;
                    break;
                case PinMode.PINMODE_OUTPUT:
                    direction = 1;
                    break;
                case PinMode.PINMODE_INPUT_PULLUP:
                    direction = 0;
                    output = 1;
                    break;
            }

            stepperContext.state = update(stepperContext.state,
                {
                    ports: {
                        [pin]: {
                            direction: {$set: direction},
                            output: {$set: output}
                        }
                    }
                });
        });

        stepperApi.addBuiltin('digitalWrite', function* digitalWriteBuiltin(stepperContext, pin, level) {
            yield ['digitalWrite', pin.toInteger(), level.toInteger()];
        });
        stepperApi.onEffect('digitalWrite', function* digitalWriteEffect(stepperContext, pin, level) {
            stepperContext.state = update(stepperContext.state,
                {
                    ports: {
                        [pin]: {
                            output: {$set: level}
                        }
                    }
                });
        });

        stepperApi.addBuiltin('digitalRead', function* digitalReadBuiltin(stepperContext, pin) {
            const level = yield ['digitalRead', pin.toInteger()];

            yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
        });
        stepperApi.onEffect('digitalRead', function* digitalReadEffect(stepperContext, pin) {
            const port = stepperContext.state.ports[pin];
            if (port.direction === 1) {
                /* Pin configured as output, read driver level. */
                return port.output;
            }

            /* TODO: read peripheral */

            return (stepperContext.state.ports[pin].input >= 0.8) ? 1 : 0;
        });

        stepperApi.addBuiltin('analogRead', function* analogReadBuiltin(stepperContext, pin) {
            const level = yield ['analogRead', pin.toInteger()];

            yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
        });
        stepperApi.onEffect('analogRead', function* analogReadEffect(stepperContext, pin) {
            const port = stepperContext.state.ports[pin];
            if (port.direction === 1) {
                /* Pin configured as output, read 0. */
                return 0;
            }
            if (port.peripheral.type === 'slider') {
                return Math.round(port.input * 1023);
            }

            /* Assume no peripheral connected, read pull-up. */
            return (port.output === 1 ? 1023 : 0);
        });

        stepperApi.addBuiltin('Serial_begin', function* (stepperContext, speed) {
            yield ['serialBegin', speed.toInteger()];
        });
        stepperApi.onEffect('serialBegin', function* (stepperContext, speed) {
            stepperContext.state = update(stepperContext.state,
                {serial: {speed: {$set: speed}}});
        });

        stepperApi.addBuiltin('Serial_print', function* (stepperContext, value, base) {
            const str = stringifyValue(stepperContext.state.programState, value, base);

            if (stepperContext.state.serial.speed) {
                yield ['write', str];
            }
        });

        stepperApi.addBuiltin('Serial_println', function* (stepperContext, value, base) {
            const str = stringifyValue(stepperContext.state.programState, value, base) + '\n';

            if (stepperContext.state.serial.speed) {
                yield ['write', str];
            }
        });

        stepperApi.addBuiltin('Serial_write', function* (stepperContext, value) {
            if (stepperContext.state.serial.speed) {
                yield ['write', String.fromCharCode(value.toInteger())];
            }
        });
    });
};

function stringifyValue(programState, value, base) {
    if (!value) {
        return '';
    }

    let str;
    switch (value.type.kind) {
        case 'pointer':
            str = C.readString(programState.memory, value);
            break;
        case 'builtin':
            switch (value.type.repr) {
                case 'char':
                    str = String.fromCharCode(value.number)
                    break;
                case 'unsigned char':
                case 'unsigned short':
                case 'unsigned int':
                case 'unsigned long':
                    str = value.toInteger().toString(base.toInteger());
                    break;
                case 'int':
                case 'short':
                case 'long': {
                    let intVal = value.toInteger();
                    if (intVal < 0) {
                        intVal = -intVal;
                        str = '-';
                    } else {
                        str = '';
                    }
                    str = str + intVal.toString(base.toInteger());
                    break;
                }
                case 'double':
                case 'float':
                default:
                    str = value.toString();
                    break;
            }
            break;
        default:
            console.log('handle type', value.type.kind);
            str = value.toString();
    }

    return str;
}
