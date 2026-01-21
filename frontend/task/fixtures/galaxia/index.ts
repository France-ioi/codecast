import {QuickalgoTask} from '../../task_types';

export default {
    gridInfos: {
        context: "quickpi",
        quickPiBoard: "galaxia",
        importModules: ['connected-boards'],

        defaultLevel: "easy",
        hideSaveOrLoad: false,
        actionDelay: 100,
        maxIterWithoutAction: 6000/12,
        customSensors: true,

        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                thingz: [
                    "readAcceleration",
                    "isButtonPressedWithName",
                    "readMagneticForce",
                    "computeCompassHeading",
                    "temperature",
                    "lightIntensity",

                    // {className: "Led", classInstances: ["led"], methods: ["set_colors", "read_light_level"]},
                ],
                // machine: [
                //     {className: "Pin", init: true, methods: ["on", "off"]},
                //     {className: "PWM", init: true, methods: ["duty", "duty_u16"]},
                //     "time_pulse_us",
                // ],
                time: [
                    "sleep",
                    "sleep_us",
                ],
                // network: [
                //     {className: "WLAN", init: true, methods: ["active", "scan", "connect", "isconnected", "ifconfig", "disconnect"]},
                // ],
                // requests: [
                //     "get",
                //     "post",
                //     {className: "Response", init: true, methods: ["json"]},
                // ],
                // json: [
                //     "dumps",
                // ],
            },
            standardBlocks: {
                includeAll: true
            },
        },
        maxInstructions: {
            easy: 2000,
            medium: 10,
            hard: 11
        },
        quickPiSensors: "default",
        // quickPiSensors: [
        //     // { type: "led", name: 'led', port: 'D5'},
        //     // { type: "ledrgb", name: 'ledrgb' },
        //     // { type: "leddim", name: 'leddim', port: 'D8'},
        //     // { type: "accelerometer", name: 'accel' },
        //     // { type: "magnetometer", name: 'magneto' },
        //     // { type: "button", name: 'button_a' },
        //     // { type: "button", name: 'button_b' },
        //     // { type: "button", name: 'touch_n' },
        //     // { type: "button", name: 'touch_e' },
        //     // { type: "button", name: 'touch_s' },
        //     // { type: "button", name: 'touch_w' },
        //     // { type: "servo", name: 'servo', port: 'D7' },
        //     // { type: "buzzer", name: 'buzzer' },
        //     // { type: "temperature", name: 'temp' },
        //     // { type: "light", name: 'light' },
        //     // { type: "range", name: 'range', port: 'D9' },
        //     { type: "wifi", name: 'wifi' },
        // ],
        //         startingExample: {
        //             python: `from thingz import *
        // from machine import *
        // from utime import *
        // from network import *
        // from urequests import *
        // from ujson import *
        // wlan = WLAN(STA_IF)`,
        //         }
    },

    data: {
        easy: [{
            autoGrading: false,
            loopsForever: true,
            testName: "Expérimenter",
        },
        {
            testName: "Test 1",
            autoGrading: true,
            loopsForever: true,
            output: [
                // { time: 0, type: "wifi", name: "wifi", state: {active: false} },
                // { time: 1000, type: "wifi", name: "wifi", state: {active: true, connected: false} },
                // { time: 2000, type: "wifi", name: "wifi", state: {connected: true, ssid: 'reseau', password: 'password'} },
                // { time: 3000, type: "wifi", name: "wifi", state: {lastRequest: {method: 'GET', url: 'https://emoncms.fr/feed/value.json?id=88', headers: {test: 'bla'}}}},


                // { time: 0, type: "accelerometer", name: "accel", state: [0, 0, 1] },
                // { time: 1000, type: "accelerometer", name: "accel", state: [0, 0, 4] },
                // { time: 2000, type: "accelerometer", name: "accel", state: [0, 0, 3] },

                // { time: 0, type: "servo", name: "servo", state: 20 },
                // { time: 1000, type: "servo", name: "servo", state: 30 },
                // { time: 2000, type: "servo", name: "servo", state: 40 },

                // { time: 0, type: "led", name: "led", state: false },
                // { time: 1000, type: "led", name: "led", state: true },
                // { time: 2000, type: "led", name: "led", state: false },
            ],
        }],
        medium: [{
            autoGrading: false,
            testName: "Expérimenter",
        },
        {
            testName: "Test 1",
            autoGrading: true,
            loopsForever: true,
            output: [
                { time: 0, type: "led", name: "led1", state: true },
                { time: 1000, type: "led", name: "led1", state: false },
            ],
        }],
        hard: [{
            autoGrading: false,
            testName: "Expérimenter",
        },
        {
            testName: "Test 1",
            autoGrading: true,
            loopsForever: true,
            output: [
                { time: 0, type: "led", name: "led1", state: true },
                { time: 3000, type: "led", name: "led1", state: false },
                { time: 5000, type: "led", name: "led1", state: true },
                { time: 6000, type: "led", name: "led1", state: false },
            ],
        }],
    },
} as QuickalgoTask

// displayHelper.avatarType = "none";
// displayHelper.timeoutMinutes = 0;
