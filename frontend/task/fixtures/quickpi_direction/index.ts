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
        context: 'quickpi',
        importModules: ['quickpi-board', 'quickpi-connection', 'quickpi-screen', 'blockly-quickpi'],
        quickPiDisableConnection: true,
        hideSaveOrLoad: false,
        hideControls: {blocklyToPython: false},
        actionDelay: 100,
        conceptViewer: [
            'base',
            'quickpi_button',
            'quickpi_screen'
        ],

        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                quickpi: {
                    easy: ["isButtonPressed","displayText"],
                    medium: ["isButtonPressed","displayText"],
                    hard: ["isButtonPressedWithName","displayText"],
                }
            },
            standardBlocks: {
                includeAll: false,
                singleBlocks: {
                    easy: ["controls_infiniteloop","controls_if"],
                    medium: ["controls_infiniteloop","controls_if"],
                    hard: ["controls_infiniteloop","controls_if"]
                },
            },
        },
        //maxInstructions: 22,
        quickPiSensors: {
            easy: [
                { type: "screen", name: 'screen' },
                { type: "button", name: 'button1' }
            ],
            medium: [
                { type: "screen", name: 'screen' },
                { type: "button", name: 'button1' }
            ],
            hard: [
                { type: "screen", name: 'screen' },
                { type: "stick", name: 'stick1' }
            ],
        }
    },

    data: {
        easy: [{
            autoGrading: false,
            testName: "Expérimenter",
        },
        {
            testName: "Valider",
            autoGrading: true,
            loopsForever: true,
            output: function() {
                og.start();
                og.setElementState("button","button1",false);
                og.setElementState("screen","screen",{line1:"",line2:""});
                og.sleep(100);
                og.setElementState("button","button1",true);
                og.setElementState("screen","screen",{line1:"Bonjour",line2:""});

                return og.getEvents();
            }(),
        }],
        medium: [{
            autoGrading: false,
            testName: "Expérimenter",
        },
        {
            testName: "Valider",
            autoGrading: true,
            loopsForever: true,
            output: function() {
                og.start();
                og.setElementState("button","button1",false);
                og.setElementState("screen","screen",{line1:"Appuyez", line2:""});
                og.sleep(100);
                og.setElementState("button","button1",true);
                og.setElementState("screen","screen",{line1:"Merci",line2:""});

                return og.getEvents();
            }(),
        }],
        hard: [{
            autoGrading: false,
            testName: "Expérimenter",
        },
        {
            testName: "Valider",
            autoGrading: true,
            loopsForever: true,
            output: function() {
                og.start();
                og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:"Direction ?",line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[true, false, false, false, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:"Haut",line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[false, false, true, false, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:"Gauche",line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[false, true, false, false, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:"Bas",line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[false, false, false, true, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:"Droite",line2:""});

                return og.getEvents();
            }(),
        }]
    },
} as QuickalgoTask

// displayHelper.avatarType = "none";
// displayHelper.timeoutMinutes = 0;
