function initTask(subTask) {

    subTask.gridInfos = {
        //blocksLanguage: 'fr',

        /*
        blocksLanguage: {
            python: 'fr',
            blockly: 'fr'
        },
        */

        hideSaveOrLoad: false,
        actionDelay: 200,
        buttonScaleDrawing: false,

        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                database: [
                    'loadTable',
                    'loadTableFromCsv',
                    'loadTableFromCsvWithTypes',
                    'joinTables',
                    'displayTable',
                    'unionTables',
                    'displayRecord',
                    'getColumn',
                    'displayTableOnMap',
                    'getRecords',
                    'selectByColumn',
                    'selectByFunction',
                    'selectTopRows',
                    'sortByColumn',
                    'sortByFunction',
                    'selectColumns',
                    'updateWhere',
                    'insertRecord',
                    'printConsole',
                    'displayTableOnGraph'
                ]
            },
            standardBlocks: {
                wholeCategories: ["logic", "loops", "math", "texts", "lists", "dicts", "variables", "functions"],
                includeAll: true
            }
        },
        maxInstructions: 100,
        checkEndEveryTurn: false,
        checkEndCondition: function(context, lastTurn) {
            //context.expectTable('valid_table');
            context.expectHash(234396131);
        },
        databaseConfig: {
            pin_file: 'img/pin.png',
            pin_file_mistake: 'img/pin2.png',
            map_file: 'img/carteDeFrance.png',
            map_lng_left: -4.85,
            map_lng_right: 9.65,
            map_lat_top: 51.6,
            map_lat_bottom: 41.7,
            //disable_csv_import: true,
            //calculate_hash: true,
            //strict_types: true
        },
        startingExample: {
            easy: {
                blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="cwD?Km9#D6D_9NH{A6z." deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="variables_set" id="a]yR,?2V:Y{m[l@LB21d"><field name="VAR">testTable</field><value name="VALUE"><block type="loadTable" id="fk_p6Sad,f:)m!aga1=/"><value name="PARAM_0"><shadow type="text" id="kzOpIV1e?gT;WG;vkW(0"><field name="TEXT">test_table</field></shadow></value></block></value><next><block type="displayTable" id=",`vFND|DG-thvpo?[!*h"><value name="PARAM_0"><block type="variables_get" id="eX}C#H;I@ep@`krGs._m"><field name="VAR">testTable</field></block></value><value name="PARAM_1"><block type="lists_create_with" id="eJck9xqe(BAu+[+YwNzR"><mutation items="4"></mutation><value name="ADD0"><block type="text" id="~(IMsSdX=oJfbw:F;prx"><field name="TEXT">id</field></block></value><value name="ADD1"><block type="text" id="!vX`z7e]|Vwz)sj*~)dN"><field name="TEXT">image</field></block></value><value name="ADD2"><block type="text" id="s6GeqLT,t)Znb::/f=r;"><field name="TEXT">name</field></block></value><value name="ADD3"><block type="text" id="h!`nE@pJO#)gvd@HEc7U"><field name="TEXT">date</field></block></value></block></value></block></next></block></next></block></xml>'
            }
        }
    }


    var test_table = {
        columnNames: [
            'id', 'image', 'name', 'date'
        ],
        columnTypes: [
            'number', 'image', 'string', 'date'
        ],
        records: [
            [ 1, 'img/apple.jpg', 'apple', '2018-01-01' ],
            [ 2, 'img/banana.jpg', 'banana', '2019-01-01' ],
            [ 3, 'img/kiwi.jpg', 'kiwi', '2020-01-01' ],
            //[ 4, null, 'null_image_here_null_image_here_null_image_here_null_image_here', '2021-01-01' ],
        ]
    }


    var valid_table = {
        columnNames: [
            'id', 'image', 'name', 'date'
        ],
        columnTypes: [
            'number', 'image', 'string', 'date'
        ],
        records: [
            [ 1, 'img/apple.jpg', 'apple', '2018-01-01' ],
            [ 2, 'img/banana.jpg', 'banana', '2019-01-01' ],
            [ 3, 'img/kiwi.jpg', 'kiwi', '2020-01-01' ]
        ]
    }



    var test_table2 = {
        columnNames: [
            'city', 'lng', 'lat'
        ],
        columnTypes: [
            'string', 'number', 'number'
        ],
        records: [
            ["Tours", 0.700347, 47.405046],
            ["Besançon", 6.023490, 47.270439],
            ["Lille", 3.056121, 50.650582]
        ]
    }


    var valid_table2 = {
        // column names order important here, must be: city, lng, lat
        columnNames: [
            'city', 'lng', 'lat'
        ],
        columnTypes: [
            'string', 'number', 'number'
        ],
        records: [
            ["Tours", 0.700347, 47.405046],
            ["Besançon", 6.023490, 47.270439],
            //["Lille", 3.056121, 50.650582]
        ]
    }

    subTask.data = {
        easy: [
            {
                tables: {
                    test_table: {
                        public: true,
                        data: test_table
                    },
                    valid_table: {
                        public: false,
                        data: valid_table
                    }
                }
            },
            {
                tables: {
                    test_table: {
                        public: true,
                        data: test_table
                    },
                    valid_table: {
                        public: false,
                        data: valid_table
                    },
                    test_table2: {
                        public: true,
                        data: test_table2
                    },
                    valid_table2: {
                        public: false,
                        data: valid_table2
                    }
                }
            }
        ]
    }
    initBlocklySubTask(subTask)
}
initWrapper(initTask, null, null)