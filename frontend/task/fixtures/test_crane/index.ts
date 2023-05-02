import {QuickalgoTask} from '../../task_slice';

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
        importModules: ['blockly-crane-1.0', 'beav-1.0'],
        images,
        conceptViewer: true,
        showLabels: true,
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
                robot: [ "take" ]
            },
            standardBlocks: {
                includeAll: false
            }
        },
        // computeGrade: function (context, message) {
        //     var rate = 0;
        //     if (context.success) {
        //         rate = 0.5;
        //         message += " Partial score granted.";
        //     }
        //     return {
        //         successRate: rate,
        //         message: message
        //     };
        // },
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
                    [ 1, 2, 1, 1, 1, 1]
                ],
                broken: [

                ],
                target: [
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1]
                ],
                initItems: [
                ],
                customItems: {
                },
                initCranePos: 1
            }
        ],
        medium: [
            {
                container: [

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 2, 1, 1, 1, 1]
                ],
                broken: [

                ],
                target: [
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1],
                    [ 1, 1, 1, 1, 1, 1]
                ],
                initItems: [
                ],
                customItems: {
                },
                initCranePos: 1
            }
        ]
    },
} as QuickalgoTask
