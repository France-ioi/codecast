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
        conceptViewer: true,
        showLabels: true,
        rowLabelEnabled: false,
        showContLabels: true,
        showContOutline: true,
        contextType: "numbers",
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
                robot: ["left", "right", "take", "putDown", "placeMarker", "goToMarker" ]
            },
            standardBlocks: {
                includeAll: false,
                singleBlocks: ["controls_repeat"]
            }
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

                ],
                tiles: [
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 2, 3, 4, 5, 6, 7, 8, 1, 1, 1 ]
                ],
                broken: [

                ],
                mask: [

                ],
                target: [
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 7, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 6, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1 ],
                    [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1 ]
                ],
                initItems: [

                ],
                initCranePos: 0
            }
        ]
    },
}
