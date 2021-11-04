const images = [
    require('./gem.png'),
    require('./icon.png'),
    require('./red_robot.png'),
];

export default {
    gridInfos: {
        context: 'robot',
        images,
        contextType: "chticode_abs",
        maxInstructions: 8,
        backgroundColor: "#e3c6ff",
        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                robot: ["east", "west", "north", "south"]
            },
            standardBlocks: {
                includeAll: false,
                wholeCategories: [],
                singleBlocks: ["controls_repeat"]
            }
        },
        hideControls: {
            speedSlider: true,
            goToEnd: true,
            saveOrLoad: true,
            loadBestAnswer: true
        },
        introMaxHeight: "60%",
        zoom: {
            controls: false,
            scale: 1.2
        }
    },
    data: {
        easy: [
            {
                tiles: [
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 3, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1],
                    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
                ],
                initItems: [
                    { row: 6, col: 11, type: "red_robot" }
                ]
            }
        ]
    }
}
