function initTask(subTask) {

    var og = new OutputGenerator();

    subTask.gridInfos = {
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
    };

    subTask.data = {
        easy: [{
            autoGrading: false,
            testName: quickPiLocalLanguageStrings[window.stringsLanguage].messages.experiment,
        },
        {
            testName: quickPiLocalLanguageStrings[window.stringsLanguage].messages.validate,
            autoGrading: true,
            loopsForever: true,
            output: function() {
                og.start();
                og.setElementState("button","button1",false);
                og.setElementState("screen","screen",{line1:"",line2:""});
                og.sleep(100);
                og.setElementState("button","button1",true);
                og.setElementState("screen","screen",{line1:window.quickPiHello,line2:""});

                return og.getEvents();
            }(),
        }],
        medium: [{
            autoGrading: false,
            testName: quickPiLocalLanguageStrings[window.stringsLanguage].messages.experiment,
        },
        {
            testName: quickPiLocalLanguageStrings[window.stringsLanguage].messages.validate,
            autoGrading: true,
            loopsForever: true,
            output: function() {
                og.start();
                og.setElementState("button","button1",false);
                og.setElementState("screen","screen",{line1:window.quickPiPress, line2:""});
                og.sleep(100);
                og.setElementState("button","button1",true);
                og.setElementState("screen","screen",{line1:window.quickPiThankYou,line2:""});

                return og.getEvents();
            }(),
        }],
        hard: [{
            autoGrading: false,
            testName: quickPiLocalLanguageStrings[window.stringsLanguage].messages.experiment,
        },
        {
            testName: quickPiLocalLanguageStrings[window.stringsLanguage].messages.validate,
            autoGrading: true,
            loopsForever: true,
            output: function() {
                og.start();
                og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:window.quickPiDirection,line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[true, false, false, false, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:window.quickPiUp,line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[false, false, true, false, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:window.quickPiLeft,line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[false, true, false, false, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:window.quickPiDown,line2:""});
                og.sleep(100);
                og.setElementState("stick","stick1",[false, false, false, true, false]);
                // og.setElementState("stick","stick1",[false, false, false, false, false]);
                og.setElementState("screen","screen",{line1:window.quickPiRight,line2:""});

                return og.getEvents();
            }(),
        }]

    };

    initBlocklySubTask(subTask);
}

displayHelper.avatarType = "none";
//initWrapper(initTask, null, null);
initWrapper(initTask, ["easy", "medium", "hard"], "easy", true);

