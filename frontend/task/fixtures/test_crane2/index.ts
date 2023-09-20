import {QuickalgoTask} from '../../task_types';

const images = [
    {path: require('./icon.png')},
    {path: require('./crane.png')},
    {path: require('./crane.svg')},
    {path: require('./assets/png/01.png')},
    {path: require('./assets/png/02.png')},
    {path: require('./assets/png/03.png')},
    {path: require('./assets/png/04.png')},
    {path: require('./assets/png/05.png')},
    {path: require('./assets/png/06.png')},
    {path: require('./assets/png/07.png')},
    {path: require('./assets/png/08.png')},
    {path: require('./assets/png/09.png')},
    {path: require('./assets/png/10.png')},
    {path: require('./assets/png/11.png')},
    {path: require('./assets/png/hidden_01.png')},
    {path: require('./assets/png/hidden_02.png')},
    {path: require('./assets/png/hidden_03.png')},
    {path: require('./assets/png/hidden_04.png')},
    {path: require('./assets/png/hidden_05.png')},
    {path: require('./assets/png/hidden_06.png')},
    {path: require('./assets/png/hidden_07.png')},
    {path: require('./assets/png/hidden_08.png')},
    {path: require('./assets/png/hidden_09.png')},
    {path: require('./assets/png/overlay.png')},
];

export default {
    gridInfos: {
        context: 'crane',
        importModules: ['blockly-crane-1.1', 'beav-1.0', 'randomGenerator-1.0'],
        images,
        conceptViewer: true,
        showLabels: true,
        // backgroundSrc: window.modulesPath + 'img/algorea/crane/foret.jpg',
        rowLabelEnabled: { side: 0, countDir: 1 },
        showContLabels: true,
        showContOutline: true,
        customItems: true,
        contextType: "numbers",
        hideControls: { saveOrLoad: false},
        hiddenTests: true,
        dropAllBlocks: true,

        nbPlatforms: 100,
        maxInstructions: {
            easy: 40,
            medium: 200,
            hard: 100
        },
        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                robot: [ "right", "left", "take", "putDown", "drop", "up", "down", "carriedBlock", "readBlock", "flip", "craneColumn", "craneRow", "moveCraneColumn", "moveCraneRow", "p4PlayMove" ]
            },
            standardBlocks: {
                includeAll: false,
                wholeCategories: ["variables"],
                singleBlocks: ["controls_if", "controls_if_else", "logic_compare", "logic_operation", "logic_negate", "math_number", "math_arithmetic", "controls_repeat_ext", "controls_for", "controls_whileUntil", "procedures_defnoreturn", "procedures_defreturn"]
            }
        }
    },
    data: {
        medium: [
            {
                overlay: { src: "build/images/test_crane2/assets/png/overlay.png", pos: [[-0.1,1],[7.1,8]] },
                container: [

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 4, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 5, 1],
                    [ 1, 1, 9,10, 1, 1, 1, 1, 9, 10, 4, 1],
                    [ 1, 1, 9, 9,10, 1, 1, 1, 9, 10, 7, 1],
                    [10,10, 9,10, 9,10, 9, 1, 9, 10, 2, 1],
                    [11,11,11,11,11,11,11,12, 9, 10, 4, 98],
                ],
                hidden: [
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
                ],
                broken: [

                ],
                initItems: [

                ],
                customItems: {
                },
                scoring: [
                    {
                        score: 1,
                        target: [
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1],
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1],
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                            [ 1, 1, 9, 1, 1, 1, 1, 1, 9, 10, 5, 1],
                            [ 1, 1, 9,10, 1, 1, 1, 1, 9, 10, 4, 1],
                            [ 1, 1, 9, 9,10, 1, 1, 1, 9, 10, 7, 1],
                            [10,10, 9,10, 9,10, 9, 9, 9, 10, 2, 1],
                            [11,11,11,11,11,11,11,12, 9, 10, 4, 98],
                        ],
                        hidden: [
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
                        ]
                    }
                ],

                initCranePos: 10,
                initTool: 0,
                initState: {
                    hideTarget: true
                }
            },
            {
                overlay: { src: "build/images/test_crane2/assets/png/overlay.png", pos: [[-0.1,1],[7.1,8]] },
                container: [

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 3, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 5, 1],
                    [ 1, 1, 9,10, 1, 1, 1, 1, 9, 10, 4, 1],
                    [ 1, 1, 9, 9,10, 1, 1, 1, 9, 10, 7, 1],
                    [10,10, 9,10, 9,10, 9, 1, 9, 10, 2, 1],
                    [11,11,11,11,11,11,11,12, 9, 10, 4, 98],
                ],
                hidden: [
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
                ],
                broken: [

                ],
                initItems: [

                ],
                customItems: {
                },
                scoring: [
                    {
                        score: 1,
                        target: [
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1],
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 5, 1],
                            [ 1, 1, 9,10, 1, 1, 1, 1, 9, 10, 4, 1],
                            [ 1, 9, 9, 9,10, 1, 1, 1, 9, 10, 7, 1],
                            [10,10, 9,10, 9,10, 9, 1, 9, 10, 2, 1],
                            [11,11,11,11,11,11,11,12, 9, 10, 4, 98],
                        ],
                        hidden: [
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
                        ]
                    }
                ],

                initCranePos: 10,
                initTool: 0,
                initState: {
                    hideTarget: true
                }
            },
            {
                overlay: { src: "build/images/test_crane2/assets/png/overlay.png", pos: [[-0.1,1],[7.1,8]] },
                container: [

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 6, 1],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 5, 1],
                    [ 1, 1, 1,10, 9, 1, 1, 1, 9, 10, 4, 1],
                    [ 1, 1,10, 9, 9, 1, 1, 1, 9, 10, 7, 1],
                    [10,10, 9,10, 9,10, 9, 1, 9, 10, 2, 1],
                    [11,11,11,11,11,11,11,12, 9, 10, 4, 98],
                ],
                hidden: [
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                    [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
                ],
                broken: [

                ],
                initItems: [

                ],
                customItems: {
                },
                scoring: [
                    {
                        score: 1,
                        target: [
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1],
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1],
                            [ 1, 1, 1, 1, 1, 1, 1, 1, 9, 10, 1, 1],
                            [ 1, 1, 1, 1, 9, 1, 1, 1, 9, 10, 5, 1],
                            [ 1, 1, 1,10, 9, 1, 1, 1, 9, 10, 4, 1],
                            [ 1, 1,10, 9, 9, 1, 1, 1, 9, 10, 7, 1],
                            [10,10, 9,10, 9,10, 9, 9, 9, 10, 2, 1],
                            [11,11,11,11,11,11,11,12, 9, 10, 4, 98],
                        ],
                        hidden: [
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
                            [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
                        ]
                    }
                ],

                initCranePos: 10,
                initTool: 0,
                initState: {
                    hideTarget: true
                }
            }
        ]
    },
} as QuickalgoTask
