function initTask(subTask) {

    subTask.gridInfos = {
        hideSaveOrLoad: false,
        actionDelay: 100,

        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                quickpi: {
                    easy: ["setLedState", "setBuzzerState", "sleep"],
                    medium: ["setLedState", "setBuzzerState", "sleep"],
                    hard: ["setLedState", "setBuzzerState", "sleep"],
                }
            },
            standardBlocks: {

            },
        },
        //maxInstructions: 22,
        quickPiSensors: {
            easy: [
                { type: "led", name: 'led1' },
                { type: "buzzer", name: 'buzzer1' },
            ],
            medium: [
                { type: "led", name: 'led1' },
                { type: "led", name: 'led2' },
                { type: "buzzer", name: 'buzzer1' },
            ],
            hard: [
                { type: "led", name: 'led1' },
                { type: "led", name: 'led2' },
                { type: "led", name: 'led3' },
                { type: "buzzer", name: 'buzzer1' },
            ],
        }
    };

    subTask.data = {
        easy: [{
            autoGrading: false,
            testName: "Expérimenter",
        },
        {
            testName: "Test 1",
            autoGrading: true,
            loopsForever: true,
            output: [
                { time: 0, type: "led", name: "led1", state: true },
                { time: 0, type: "buzzer", name: "buzzer1", state: true },
                { time: 1000, type: "led", name: "led1", state: false },
                { time: 1000, type: "buzzer", name: "buzzer1", state: false },
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
                { time: 0, type: "buzzer", name: "buzzer1", state: true },
                { time: 100, type: "buzzer", name: "buzzer1", state: false },

                { time: 1000, type: "led", name: "led2", state: true },
                { time: 1000, type: "buzzer", name: "buzzer1", state: true },
                { time: 1100, type: "buzzer", name: "buzzer1", state: false },

                { time: 2000, type: "led", name: "led1", state: false },
                { time: 2000, type: "buzzer", name: "buzzer1", state: true },
                { time: 2100, type: "buzzer", name: "buzzer1", state: false },

                { time: 3000, type: "led", name: "led2", state: false },
                { time: 3000, type: "buzzer", name: "buzzer1", state: true },
                { time: 3100, type: "buzzer", name: "buzzer1", state: false },

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
                { time: 0, type: "buzzer", name: "buzzer1", state: true },
                { time: 500, type: "led", name: "led1", state: false },
                { time: 500, type: "buzzer", name: "buzzer1", state: false },

                { time: 1000, type: "led", name: "led2", state: true },
                { time: 1000, type: "buzzer", name: "buzzer1", state: true },
                { time: 1500, type: "led", name: "led2", state: false },
                { time: 1500, type: "buzzer", name: "buzzer1", state: false },

                { time: 2000, type: "led", name: "led3", state: true },
                { time: 2000, type: "buzzer", name: "buzzer1", state: true },
                { time: 2500, type: "led", name: "led3", state: false },
                { time: 2500, type: "buzzer", name: "buzzer1", state: false },
            ],
        }]

    };

    initBlocklySubTask(subTask);
}

displayHelper.avatarType = "none";
//initWrapper(initTask, null, null);
initWrapper(initTask, ["easy", "medium", "hard"], "easy", true);

