import {QuickalgoTask} from '../../task_types';

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
    {path: require('./assets/png/01.png')},
    {path: require('./assets/png/02.png')},
    {path: require('./assets/png/F-1.png')},
    {path: require('./assets/png/F-1_alpha.png')},
];

export default {
    gridInfos: {
        context: 'crane',
        importModules: ['blockly-crane-1.1', 'beav-1.0', 'randomGenerator-1.0'],
        images,
        conceptViewer: true,
        showLabels: true,
        // backgroundSrc: window.modulesPath + 'img/algorea/crane/foret.jpg',
        rowLabelEnabled: false,
        showContLabels: true,
        showContOutline: true,
        customItems: true,
        contextType: "numbers",
        hideControls: { saveOrLoad: false},
        defaultLevel: "basic",

        nbPlatforms: 100,
        maxInstructions: {
            basic: 40,
            easy: 40,
            medium: 40,
            hard: 100
        },
        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                robot: [ "take", "putDown", "right", "left", "up", "down", "readBlock", "drop", "flip" ]
            },
            standardBlocks: {
                includeAll: false,
                singleBlocks: ["controls_if", "logic_compare", "math_number"]
            }
        }
    },
    data: {
        basic: [
            {
                container: [],
                tiles: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1],
                    [1, 2, 1, 1, 1, 1]
                ],
                broken: [],
                target: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1]
                ],
                initItems: [],
                customItems: {},
                initCranePos: 1
            }
        ],
        easy: [
            {
                container: [],
                tiles: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 3, 4, 1],
                    [1, 2, 1, 5, 6, 1]
                ],
                broken: [],
                target: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 2, 1, 1],
                    [1, 1, 1, 3, 4, 1],
                    [1, 1, 1, 5, 6, 1]
                ],
                initItems: [],
                customItems: {
                    // 2: { img: "assets/png/activite-01-05.png" },
                    // 3: { img: "assets/png/activite-01-03.png" },
                    // 4: { img: "assets/png/activite-01-04.png" },
                    // 5: { img: "assets/png/activite-01-01.png" },
                    // 6: { img: "assets/png/activite-01-02.png" }
                },
                successAnim: {
                    img: [
                        {src: "assets/png/anim.png", row: 2, col: 3, width: 2, height: 2, loop: true}
                    ]
                },
                initCranePos: 0
            }
        ]
    },
} as QuickalgoTask
