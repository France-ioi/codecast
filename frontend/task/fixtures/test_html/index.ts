import {QuickalgoTask} from '../../task_types';

export default {
    gridInfos: {
        context: 'html',
        // importModules: ['createAlgoreaInstructions-1.0', 'algoreaInstructionsStrings'],
        // conceptViewer: ["extra_variable"],
        // contextType: "sokoban",
        backgroundColor: "#c2c6f2",
        borderColor: "a4aacd",
        showLabels: true,
        logOption: true,
        maxInstructions: {
            easy: 20,
            medium: 30,
            hard: 40
        },
        unlockedLevels: 2,
        tabsEnabled: true,
        zoom: {
            wheel: true,
        },
        // documentationOpenByDefault: true,
        // hiddenTests: true,
        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                html: [
                    "class_selector",
                    "id_selector",
                    "element_selector",
                    "css_selector",
                    "css_font-size",
                    "css_text-align",
                    "css_background-color",
                    "css_color",
                    "css_width",
                    "css_height",
                    "js_event",
                    "js_add_class",
                    "js_remove_class",
                ],
            },
            standardBlocks: {
                includeAll: false,
                singleBlocks: ["text", "controls_whileUntil", "logic_compare", "controls_repeat", "math_number", "math_arithmetic"],
            },
        },
        startingExample: {
            html: `<body>
    <div>
        <h1>Example Domain </h1>
        <p>
            This domain is for use in illustrative examples.
        </p>
        <p>
            More <i>information </i>...
        </p>
        <span><i>Hello world </i></span>
        <p>
            Hello!
        </p>
    </div>
</body>`,
        },
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
            }
        ],
        // medium: [
        //     {
        //         tiles: [
        //             [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 3, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
        //         ],
        //         initItems: [
        //             { row: 1, col: 1, dir: 0, type: "green_robot" },
        //             { row: 1, col: 2, type: "number", value : 4},
        //             { row: 1, col: 3, type: "number", value : 8},
        //             { row: 3, col: 7, type: "box" }
        //         ]
        //     }
        // ],
        // hard: [
        //     {
        //         tiles: [
        //             [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        //             [2, 1, 1, 3, 3, 3, 3, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
        //             [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
        //         ],
        //         initItems: [
        //             { row: 5, col: 1, dir: 1, type: "green_robot" },
        //             { row: 6, col: 1, type: "number", value : 4},
        //             { row: 6, col: 3, type: "number", value : 4},
        //             { row: 6, col: 4, type: "number", value : 6},
        //             { row: 6, col: 5, type: "number", value : 3},
        //             { row: 6, col: 6, type: "number", value : 5},
        //             { row: 3, col: 3, type: "box" },
        //             { row: 5, col: 4, type: "box" },
        //             { row: 2, col: 5, type: "box" },
        //             { row: 4, col: 6, type: "box" }
        //         ]
        //     }
        // ]
    }
} as QuickalgoTask
