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
                    easy: [
                        "onButtonPressed",
                        "setLedState",
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
        multithread: true,

        //runningOnQuickPi: true,

        quickPiSensors: {
            easy: [
                { type: "screen", name: 'screen' },
                { type: "led", name: 'Rled1' },
                { type: "led", name: 'Gled1' },
                { type: "led", name: 'Bled1' },
                { type: "button", name: 'but1' },
                { type: "button", name: 'but2' },
            ],
        },

        // quickPiSensors: {
        //     easy: "default",
        // },

        startingExample: {
            easy: {
                blockly: `<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="j,T()]Gbx#C59p\`kFr|S" deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="controls_infiniteloop" id="(8[Yw+uo4\`6cX;2|Cbso"><statement name="inner_blocks"><block type="displayText" id=":||sF}zf#4U8:rqpe:o@"><value name="PARAM_0"><shadow type="text" id="+iYJ[*g}KG}w}3|fq/rN"><field name="TEXT">Bonjour</field></shadow></value></block></statement></block></next></block><block type="onButtonPressed" id="HQ}Se_7[\`Zu\`Xz:QwDT}" x="17" y="128"><field name="PARAM_0">but1</field><statement name="PARAM_1"><block type="controls_repeat_ext" id="?B/TPO{A7?rIY}kX\`bZb"><value name="TIMES"><shadow type="math_number" id="82{@j)4[{*ESvYQ.vf3/"><field name="NUM">4</field></shadow></value><statement name="DO"><block type="toggleLedState" id="8atx/+O99?Q#(oh-Hfo}"><field name="PARAM_0">Rled1</field><next><block type="sleep" id="Yuv(6LsU:9e9f_::Pxjb"><value name="PARAM_0"><shadow type="math_number" id="qF.FP58\`J7805)m(t1XA"><field name="NUM">100</field></shadow></value></block></next></block></statement></block></statement></block><block type="onButtonPressed" id="*zVCS4tcSBas4-O/;isr" x="12" y="323"><field name="PARAM_0">but2</field><statement name="PARAM_1"><block type="controls_repeat_ext" id="{wYZ8UVm-#76},tenC=u"><value name="TIMES"><shadow type="math_number" id="lQMjy(kyW@3XNN:\`ezD\`"><field name="NUM">4</field></shadow></value><statement name="DO"><block type="toggleLedState" id="1qlY\`]Qw?8:@O;~sU56j"><field name="PARAM_0">Gled1</field><next><block type="sleep" id="\`h7!mh0IGJljto.nnyIU"><value name="PARAM_0"><shadow type="math_number" id=")8]O=e_Z/w3/!BOc!ivn"><field name="NUM">100</field></shadow></value></block></next></block></statement></block></statement></block><additional>{}</additional></xml>`,
                scratch: `<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="k*j}T9Ol-zfct-:pI6S." deletable="false" movable="false" x="0" y="0"><next><block type="control_forever" id="=*x\`u*AGk6-r9Yr0~TXq"><statement name="SUBSTACK"><block type="displayText" id="H2pMtt+Sxms40K60|Md/"><value name="PARAM_0"><shadow type="text" id="uxES:(\`r]C4nvdnA2?pW"><field name="TEXT">Bonjour</field></shadow></value></block></statement></block></next></block><block type="onButtonPressed" id="E;_6/ho=u]A2X0+gd/[d" x="89" y="274"><field name="PARAM_0">but1</field><statement name="PARAM_1"><block type="control_repeat" id="\`7c~e}q.}LUjdGCr\`Ux0"><value name="TIMES"><shadow type="math_number" id="n3lDg)A2zf@6\`j9LV{Rw"><field name="NUM">4</field></shadow></value><statement name="SUBSTACK"><block type="toggleLedState" id="k49o3T(w]rmCS)tN!?D!"><field name="PARAM_0">Rled1</field><next><block type="sleep" id="#X2MkHOaxIqBj40#SP-?"><value name="PARAM_0"><shadow type="math_number" id="/aNO48O[}Ji(H:J+QC9:"><field name="NUM">100</field></shadow></value></block></next></block></statement></block></statement></block><block type="onButtonPressed" id="UQ_YlPig~QmKbW((srZp" x="76" y="570"><field name="PARAM_0">but2</field><statement name="PARAM_1"><block type="control_repeat" id="|?U74w/SyHppO9#XUj6|"><value name="TIMES"><shadow type="math_number" id="sf|j**;c-yWN,7a1;zON"><field name="NUM">4</field></shadow></value><statement name="SUBSTACK"><block type="toggleLedState" id=":H6XC1p9dSsGC\`?xqR_b"><field name="PARAM_0">Gled1</field><next><block type="sleep" id="sh-)7i1=jKyBVwU/}bJD"><value name="PARAM_0"><shadow type="math_number" id="3q~4Z8[Vl@v:5ST!ZU}8"><field name="NUM">100</field></shadow></value></block></next></block></statement></block></statement></block><additional>{}</additional></xml>`,
                python: `from quickpi import *

def on_pressed_a():
    for i in range(4):
        toggleLedState("Rled1")
        sleep(1000)

def on_pressed_b():
    for i in range(4):
        toggleLedState("Gled1")
        sleep(1000)

onButtonPressed("but1", on_pressed_a)
onButtonPressed("but2", on_pressed_b)

while True:
    displayText("test", "")`,
            },
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
