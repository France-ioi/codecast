import {QuickalgoTask} from '../../task_types';

export default {
    gridInfos: {
        context: 'quickpi',
        importModules: ['quickpi-board', 'quickpi-connection', 'quickpi-screen', 'blockly-quickpi', 'font-awesome'],
        hideSaveOrLoad: false,
        actionDelay: 0,
        conceptViewer: [
            'base',
            'quickpi_buzzer',
            'quickpi_wait',
            'quickpi_start',
            'quickpi_validation',
            'quickpi_led',
            'quickpi_wait',
            'quickpi_buzzer',
            'quickpi_button',
            'quickpi_screen',
            'quickpi_draw',
            'quickpi_range',
            'quickpi_servo',
            'quickpi_thermometer',
            'quickpi_light_sensor',
            'quickpi_accelerometer',
            'quickpi_microphone',
            'quickpi_cloud',
            'extra_nested_repeat',
            'extra_variable',
            'extra_list',
            'extra_function'
        ],


        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                quickpi: {
                    easy: ["setLedState",
                        "waitForButton",
                        "isButtonPressed",
                        "isButtonPressedWithName",
                        "setServoAngle",
                        "readTemperature",
                        "displayText",
                        "buttonWasPressed",
                        "readRotaryAngle", 
                        "turnLedOn", "sleep", 
                        "turnLedOff",
                        "readDistance",
                        "toggleLedState",
                        "readLightIntensity",
                        "currentTime", 
                        "setBuzzerState",
                        "setBuzzerNote",
                        "drawPoint", 
                        "clearScreen",
                        "drawLine",
                        "drawRectangle",
                        "drawCircle",
                        "fill",
                        "noFill",
                        "stroke",
                        "noStroke",
                        "updateScreen",
                        "autoUpdate",
                        "readAcceleration",
                        "computeRotation",
                        "readSoundLevel",
                        "readMagneticForce",
                        "computeCompassHeading",
                        "readInfraredState",
                        "setInfraredState",
                        "readAngularVelocity",
                        "setGyroZeroAngle",
                        "computeRotationGyro",
                        "setLedBrightness",
                        "getLedBrightness",
                        "isLedOn",
                        "isLedOnWithName",
                        "getServoAngle",
                        "getBuzzerNote",
                        "isBuzzerOnWithName",
                        "turnBuzzerOn",
                        "turnBuzzerOff",
                        "isBuzzerOn",
                        "displayText2Lines",
                        "isPointSet",
			                "connectToCloudStore",
			                "writeToCloudStore",
                        "readFromCloudStore",
                        "readIRMessage",
                        "sendIRMessage",
                        "presetIRMessage",
                    ],
                }
            },
            standardBlocks: {
                includeAll: true,
                //wholeCategories: ["logic", "loops", "math", "variables"],
                //wholeCategories: ["loops"],
                singleBlocks: {
                    easy: ["controls_infiniteloop", "logic_boolean", "controls_if_else", "controls_if"],
                },
            },
        },
        maxIterWithoutAction: 100000,

        customSensors: true,

        //runningOnQuickPi: true,

        quickPiSensors: {
            easy: "default",
        },
    },

    data: {
        easy: [{
            autoGrading: false,
            testName: "Expérimenter",
        }],
    },
} as QuickalgoTask

// displayHelper.avatarType = "none";
// displayHelper.timeoutMinutes = 0;
