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
        hiddenTests: true,
        partialSuccessEnabled: false,

        nbPlatforms: 100,
        maxInstructions: {
            easy: 40,
            medium: 60,
            hard: 100
        },
        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                robot: ["left", "right", "take", "drop", "topBlockBroken" ]
            },
            standardBlocks: {
                includeAll: false,
                singleBlocks: ["controls_repeat", "controls_if"]
            }
        }
    },
    data: {
        easy: [
            {
                container: [

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 3, 1, 3, 1 ],
                    [99, 1, 2, 1, 2, 1 ]
                ],
                broken: [
                    [ 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 1, 0 ],
                    [ 0, 0, 0, 0, 0, 0 ]
                ],
                mask: [
                    [ 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 0, 0, 0, 0 ],
                    [ 0, 0, 1, 1, 1, 0 ],
                    [ 0, 0, 0, 0, 0, 0 ]
                ],
                target: [
                    [ 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 3, 1, 1, 1 ],
                    [ 1, 1, 2, 1, 1, 1 ]
                ],
                initItems: [

                ],
                successAnim: {
                    img: [
                        { src: "assets/png/anim.png", row: 0, col: 0, width: 6, height: 5 }
                    ],
                    hideBlockType: "mask"
                },
                initCranePos: 0
            }
        ]
    },
}
