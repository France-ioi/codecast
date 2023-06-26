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

        nbPlatforms: 100,
        maxInstructions: {
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
        easy: [
            {
                container: [

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 2, 1, 3, 2, 1]
                ],
                broken: [

                ],
                initItems: [
                    { row: 3, col: 0, type: "die", val: 1 } // die init value
                ],
                customItems: {
                },
                scoring: [
                    {
                        score: 1,
                        target: [
                            [ 1, 1, 1, 1, 1, 1],
                            [ 1, 1, 1, 1, 1, 1],
                            [ 1, 1, 1, 2, 1, 1],
                            [ 1, 1, 1, 3, 2, 1]
                        ]
                    },
                    {
                        score: 0.6,
                        target: [
                            [ 1, 1, 1, 1, 1, 1],
                            [ 1, 1, 1, 1, 1, 1],
                            [ 1, 1, 1, 2, 1, 1],
                            [ 1, 1, 1, 3, 2, 1]
                        ],
                        subset: [
                            [ 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 1, 1, 0, 0],
                            [ 0, 0, 1, 1, 0, 0]
                        ],
                    },
                    {
                        score: 0.4,
                        target: [
                            [ 1, 1, 1, 1, 1, 1],
                            [ 1, 1, 1, 1, 1, 1],
                            [ 1, 1, 1, 1, 1, 1],
                            [ 1, 1, 1, 3, 2, 1]
                        ]
                    }
                ],

                initCranePos: 1,
                initTool: 0
            }
        ],
        medium: [
            {
                container: [

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 3, 4, 1],
                    [ 1, 2, 1, 5, 6, 1]
                ],
                broken: [

                ],
                target: [
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 2, 1, 1],
                    [ 1, 1, 1, 3, 4, 1],
                    [ 1, 1, 1, 5, 6, 1]
                ],
                initItems: [
                ],
                customItems: {
                },
                successAnim: {
                    img: [
                        { src: "assets/png/anim.png", row: 2, col: 3, width: 2, height: 2, loop: true }
                    ]
                },
                initCranePos: 0
            }
        ]
    },
} as QuickalgoTask
