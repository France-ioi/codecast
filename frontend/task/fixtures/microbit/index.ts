import {QuickalgoTask} from '../../task_types';

function OutputGenerator() {
    this.events = [];
    this.time = 0;

    this.start = function() {
        this.events = [];
        this.time = 0;
    };

    this.sleep = function(time) {
        this.time += time;
    };

    this.setElementState = function(type,name,state,input) {
        // Note : input means the grading will not check whether the program
        // actually read the sensor
        var event = {
            time: this.time,
            type: type,
            name: name,
            state: state,
            input: !!input
        };
        this.events.push(event);
    };

    this.setElementStateAfter = function(type,name,state,input,time) {
        // Note : input means the grading will not check whether the program
        // actually read the sensor
        var event = {
            time: this.time + time,
            type: type,
            name: name,
            state: state,
            input: !!input
        };
        this.events.push(event);
    };


    this.setBuzzerNote = function(name,frequency) {
        this.setElementState("buzzer", name, frequency);
    };

    this.setElementProperty = function(type,name,property,value) {
        var event = {
            time: this.time,
            type: type,
            name: name
        };
        event[property] = value;
        this.events.push(event);
    };

    this.getEvents = function() {
        return this.events;
    }
};

var og = new OutputGenerator();

export default {
    gridInfos: {
        context: "quickpi",
        quickPiBoard: "microbit",
        importModules: ['connected-boards'],

        defaultLevel: "easy",
        hideSaveOrLoad: false,
        actionDelay: 100,
        maxIterWithoutAction: 6000/12,
        customSensors: true,

        // customLedMatrixImages: [
        //     {name: "TARGET", value: "00900:09990:99099:09990:00900:"},
        //     "HOUSE",
        // ],

        // enabledGestures: ['shake'],
        enabledGestures: ['shake', 'left', 'right'],

        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                microbit: [
                    "readAcceleration",
                    "isButtonPressedWithName",
                    "readMagneticForce",
                    "computeCompassHeading",
                    "temperature",
                    'soundLevel',
                    "ledMatrixShow",
                    "ledMatrixClear",
                    "ledMatrixGetPixel",
                    "ledMatrixSetPixel",
                    "lightIntensity",
                    "wasGesture",
                ],
                music: [
                    "pitch",
                    "stop",
                ],
                time: [
                    "sleep",
                    "sleep_us",
                ],
            },
            standardBlocks: {
                includeAll: true,
                singleBlocks: {
                    easy: ["controls_infiniteloop", "logic_boolean", "controls_if_else", "controls_if"],
                },
            },
        },
        maxInstructions: {
            easy: 2000,
            medium: 10,
            hard: 11
        },
        // quickPiSensors: "default",
        quickPiSensors: [
            { type: "button", name: 'button_a', label: 'bouton A' },
            { type: "button", name: 'button_b', label: 'bouton B' },
            // { type: "button", name: 'pin_logo' },
            // { type: "temperature", name: 'temp' },
            // { type: "light", name: 'light' },
            { type: "ledmatrix", name: 'led_matrix', label: 'Panneau LED' },
            { type: "accelerometer", name: 'accel' },
            { type: "magnetometer", name: 'magneto' },
            // { type: "sound", name: 'sound', unit: ''},
            // { type: "buzzer", name: 'buzzer'},
        ],

        startingExample: {
            easy: {
                // blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="j,T()]Gbx#C59p`kFr|S" deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="variables_set" id="SX@fs?xjj![Y2akzUYl+"><field name="VAR">dfdgfg</field><value name="VALUE"><block type="readTemperature" id="lMXl])[{S4BneFHQv7W;"><field name="PARAM_0">none</field></block></value></block></next></block><additional>{}</additional></xml>',
            },
        },
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
            // output: function() {
            //     og.start();
            //     og.setElementState("button","button1",false);
            //     og.setElementState("screen","screen",{line1:"",line2:""});
            //     og.sleep(100);
            //     og.setElementState("button","button1",true);
            //     og.setElementState("screen","screen",{line1:window.quickPiHello,line2:""});
            //
            //     return og.getEvents();
            // }(),
            output: [
                // { time: 0, type: "wifi", name: "wifi", state: {active: false} },
                // { time: 1000, type: "wifi", name: "wifi", state: {active: true, connected: false} },
                // { time: 2000, type: "wifi", name: "wifi", state: {connected: true, ssid: 'reseau', password: 'password'} },
                // { time: 3000, type: "wifi", name: "wifi", state: {lastRequest: {method: 'GET', url: 'https://example.com/', headers: {test: 'bla'}}}},


                { time: 0, type: "accelerometer", name: "accel", state: [0, 0, 1, null] },
                { time: 0, type: "ledmatrix", name: "led_matrix", state: "00000:00000:00000:00000:00000".split(":").map(e => e.split('').map(Number))},
                // { time: 0, type: "ledmatrix", name: "led_matrix", state: "90009:09090:00900:09090:90009".split(":").map(e => e.split('').map(Number))},

                { time: 1000, type: "accelerometer", name: "accel", state: [0, 0, 1, 'shake'] },
                { time: 1000, type: "ledmatrix", name: "led_matrix", state: "00000:00009:00090:90900:09000".split(":").map(e => e.split('').map(Number))},

                // { time: 0, type: "servo", name: "servo", state: 20 },
                // { time: 1000, type: "servo", name: "servo", state: 30 },
                // { time: 2000, type: "servo", name: "servo", state: 40 },

                // { time: 0, type: "ledmatrix", name: "led_matrix", state: "09090:99999:99999:09990:00900".split(":").map(e => e.split('').map(Number)) },
                // { time: 500, type: "ledmatrix", name: "led_matrix", state: "00000:09090:00000:09990:90009".split(":").map(e => e.split('').map(Number))},
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
