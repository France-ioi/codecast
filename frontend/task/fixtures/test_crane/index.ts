const images = [
    {path: require('./icon.png')},
    {path: require('./crane.png')},
    {path: require('./crane.svg')},
    {path: require('./assets/background.png')},
    {path: require('./assets/cloud_1.png')},
    {path: require('./assets/cloud_2.png')},
    {path: require('./assets/cloud_3.png')},
    {path: require('./assets/crane_left_claw.png')},
    {path: require('./assets/crane_left_claw_open.png')},
    {path: require('./assets/crane_line.png')},
    {path: require('./assets/crane_right_claw.png')},
    {path: require('./assets/crane_right_claw_open.png')},
    {path: require('./assets/crane_shaft.png')},
    {path: require('./assets/crane_wheels.png')},
    {path: require('./assets/tower_1.png')},
    {path: require('./assets/tower_2.png')},
    {path: require('./assets/tower_3.png')},
    {path: require('./assets/tower_4.png')},
    {path: require('./assets/tower_5.png')},
    {path: require('./assets/tower_6.png')},
    {path: require('./assets/tower_7.png')},
    {path: require('./assets/tower_8.png')},
    {path: require('./assets/tower_9.png')},
    {path: require('./assets/tower_10.png')},
    {path: require('./assets/tower_11.png')},
    {path: require('./assets/tower_12.png')},
];

export default {
    gridInfos: {
        context: 'crane',
        importModules: ['blockly-crane-1.0', 'beav-1.0'],
        images,
        conceptViewer: ["extra_list"],
        showLabels: true,
        rowLabelEnabled: false,
        showContLabels: true,
        showContOutline: true,
        contextType: "sciFi",
        hideControls: { saveOrLoad: false},

        nbPlatforms: 100,
        maxInstructions: {
            easy: 40,
            medium: 60,
            hard: 100
        },
        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                robot: ["left", "right", "take", "drop"]
            },
            standardBlocks: {
                includeAll: false,
                // wholeCategories: ["variables"],
                singleBlocks: ["controls_repeat"]
                // singleBlocks: ["lists_create_with_empty", "lists_repeat", "lists_getIndex", "lists_setIndex", "controls_repeat_ext", "controls_whileUntil", "controls_if", "controls_if_else", "math_number", "math_arithmetic", "logic_compare", "logic_boolean", "logic_negate"]
            },
            // procedures: { disableArgs: true }
        },
        intro: {
            default: false,
            more: {
                shared: [ { type: "custom", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." } ]
            }
        }
    },
    data: {
        easy: [
            {
                container: [
                    // [1,1,1],
                    // [2,3,1],
                    // [2,3,4]
                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1],
                    [ 6, 7, 2, 1, 1, 1, 1],
                    [ 8, 9, 3, 1, 1, 1, 1],
                    [ 10, 11, 5, 1, 1, 1, 1],
                    [ 12, 13, 4, 1, 1, 1, 1]
                ],
                target: [
                    [ 1, 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 2, 3, 1],
                    [ 1, 1, 1, 1, 4, 5, 1],
                    [ 1, 1, 1, 1, 6, 7, 1],
                    [ 1, 1, 1, 1, 8, 9, 1],
                    [ 1, 1, 1, 1, 10, 11, 1],
                    [ 1, 1, 1, 1, 12, 13, 1]
                ],
                initItems: [
                    // { row: 8, col: 0, dir: 0, type: "robot" },
                ],
                initCranePos: 0
            }
        ],
        medium: [
            {
                tiles: [
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [ 2, 3, 1, 1, 1, 1, 1, 1, 1, 1],
                    [ 2, 3, 4, 3, 1, 1, 1, 1, 1, 1]
                ],
                target: [
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 4, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 2, 2, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 3, 3, 3, 1, 1]
                ],
                initItems: [
                    // { row: 8, col: 0, dir: 0, type: "robot" },
                ],
                initCranePos: 0
            }
        ]
    },
}
