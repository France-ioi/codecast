const images = [
    require('./box.png'),
    require('./icon.png'),
    require('./green_robot.png'),
    require('./marker.png'),
    require('./wall.png'),
    require('./test_easy_1.png'),
    require('./test_easy_2.png'),
    require('./test_easy_3.png'),
];

export default {
    gridInfos: {
        context: 'robot',
        images,
        conceptViewer: ["extra_variable"],
        contextType: "sokoban",
        backgroundColor: "#c2c6f2",
        borderColor: "a4aacd",
        showLabels: true,
        maxInstructions: {
            easy: 20,
            medium: 30,
            hard: 40
        },
        includeBlocks: {
            groupByCategory: {
                easy: false,
                medium: true,
                hard: true
            },
            generatedBlocks: {
                robot: {
                    basic:["pushObject", "forward", "right", "readNumber", "col"],
                    easy:["pushObject", "forward", "right", "readNumber", "col"],
                    medium:["pushObject", "forward", "right", "left", "readNumber", "col", "row"],
                    hard: ["pushObject", "forward", "backwards", "right", "left", "readNumber", "col", "row"],
                }
            },
            standardBlocks: {
                includeAll: false,
                wholeCategories: {
                    easy: [],
                    medium: [],
                    hard:["variables"]
                },
                singleBlocks: {
                    shared:["controls_whileUntil", "logic_compare"],
                    easy:["controls_repeat"],
                    medium: ["controls_repeat", "math_number", "math_arithmetic"],
                    hard: ["controls_repeat_ext", "math_number", "math_arithmetic"]
                }
            },
            variables : {
                easy: ["colonneCaisse"],
                medium: ["ligneCaisse", "colonneCaisse"]
            }
        }
    },
    data: {
        easy: [
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 1, col: 1, dir: 0, type: "green_robot" },
                    { row: 1, col: 2, type: "number", value : 9},
                    { row: 2, col: 8, type: "box" }
                ]
            },
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 1, col: 1, dir: 0, type: "green_robot" },
                    { row: 1, col: 2, type: "number", value : 5},
                    { row: 2, col: 4, type: "box" }
                ]
            },
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 1, col: 1, dir: 0, type: "green_robot" },
                    { row: 1, col: 2, type: "number", value : 8},
                    { row: 2, col: 7, type: "box" }
                ]
            }
        ],
        medium: [
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 1, col: 1, dir: 0, type: "green_robot" },
                    { row: 1, col: 2, type: "number", value : 4},
                    { row: 1, col: 3, type: "number", value : 8},
                    { row: 3, col: 7, type: "box" }
                ]
            },
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 1, col: 1, dir: 0, type: "green_robot" },
                    { row: 1, col: 2, type: "number", value : 5},
                    { row: 1, col: 3, type: "number", value : 5},
                    { row: 4, col: 4, type: "box" }
                ]
            },
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 1, col: 1, dir: 0, type: "green_robot" },
                    { row: 1, col: 2, type: "number", value : 6},
                    { row: 1, col: 3, type: "number", value : 10},
                    { row: 5, col: 9, type: "box" }
                ]
            }
        ],
        hard: [
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 5, col: 1, dir: 1, type: "green_robot" },
                    { row: 6, col: 1, type: "number", value : 4},
                    { row: 6, col: 3, type: "number", value : 4},
                    { row: 6, col: 4, type: "number", value : 6},
                    { row: 6, col: 5, type: "number", value : 3},
                    { row: 6, col: 6, type: "number", value : 5},
                    { row: 3, col: 3, type: "box" },
                    { row: 5, col: 4, type: "box" },
                    { row: 2, col: 5, type: "box" },
                    { row: 4, col: 6, type: "box" }
                ]
            },
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 5, col: 1, dir: 1, type: "green_robot" },
                    { row: 6, col: 1, type: "number", value : 8},
                    { row: 6, col: 3, type: "number", value : 4},
                    { row: 6, col: 4, type: "number", value : 6},
                    { row: 6, col: 5, type: "number", value : 4},
                    { row: 6, col: 6, type: "number", value : 5},
                    { row: 6, col: 7, type: "number", value : 3},
                    { row: 6, col: 8, type: "number", value : 4},
                    { row: 6, col: 9, type: "number", value : 3},
                    { row: 6, col: 10, type: "number", value : 5},
                    { row: 3, col: 3, type: "box" },
                    { row: 5, col: 4, type: "box" },
                    { row: 3, col: 5, type: "box" },
                    { row: 4, col: 6, type: "box" },
                    { row: 2, col: 7, type: "box" },
                    { row: 3, col: 8, type: "box" },
                    { row: 2, col: 9, type: "box" },
                    { row: 4, col: 10, type: "box" }
                ]
            },
            {
                tiles: [
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
                    [2, 1, 1, 3, 3, 3, 3, 3, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
                    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
                ],
                initItems: [
                    { row: 5, col: 1, dir: 1, type: "green_robot" },
                    { row: 6, col: 1, type: "number", value : 5},
                    { row: 6, col: 3, type: "number", value : 5},
                    { row: 6, col: 4, type: "number", value : 3},
                    { row: 6, col: 5, type: "number", value : 4},
                    { row: 6, col: 6, type: "number", value : 6},
                    { row: 6, col: 7, type: "number", value : 3},
                    { row: 4, col: 3, type: "box" },
                    { row: 2, col: 4, type: "box" },
                    { row: 3, col: 5, type: "box" },
                    { row: 5, col: 6, type: "box" },
                    { row: 2, col: 7, type: "box" }
                ]
            },
        ]
    }
}
