import {QuickalgoTask} from '../../task_slice';

const images = [
    {path: require('./img/apple.jpg')},
    {path: require('./img/banana.jpg')},
    {path: require('./img/carteDeFrance.png')},
    {path: require('./img/kiwi.jpg')},
    {path: require('./img/pin.png')},
    {path: require('./img/pin2.png')},
];

let test_table = {
    columnNames: [
        'id', 'image', 'name', 'date'
    ],
    columnTypes: [
        'number', 'image', 'string', 'date'
    ],
    records: [
        [ 1, images.find(image => -1 !== image.path.default.indexOf("apple.jpg")).path.default, 'apple', '2018-01-01' ],
        [ 2, images.find(image => -1 !== image.path.default.indexOf("banana.jpg")).path.default, 'banana', '2019-01-01' ],
        [ 3, images.find(image => -1 !== image.path.default.indexOf("kiwi.jpg")).path.default, 'kiwi', '2020-01-01' ],
        //[ 4, null, 'null_image_here_null_image_here_null_image_here_null_image_here', '2021-01-01' ],
    ]
}

let valid_table = {
    columnNames: [
        'id', 'image', 'name', 'date'
    ],
    columnTypes: [
        'number', 'image', 'string', 'date'
    ],
    records: [
        [ 1, images.find(image => -1 !== image.path.default.indexOf("apple.jpg")).path.default, 'apple', '2018-01-01' ],
        [ 2, images.find(image => -1 !== image.path.default.indexOf("banana.jpg")).path.default, 'banana', '2019-01-01' ],
        [ 3, images.find(image => -1 !== image.path.default.indexOf("kiwi.jpg")).path.default, 'kiwi', '2020-01-01' ]
    ]
}

let test_table2 = {
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


let valid_table2 = {
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

export default {
    gridInfos: {
        //blocksLanguage: 'fr',

        /*
        blocksLanguage: {
            python: 'fr',
            blockly: 'fr'
        },
        */

        context: 'database',
        importModules: ['files_repository', 'blocks_helper', 'database', 'blockly_database', 'database_css', 'chartjs', 'chartjs_styles'],
        images,
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
                    'displayTableOnGraph',
                    'initHistogram',
                    'setHistogramBar'
                ]
            },
            standardBlocks: {
                wholeCategories: ["logic", "loops", "math", "texts", "lists", "dicts", "variables", "functions"],
                includeAll: false,
            }
        },
        maxInstructions: 100,
        checkEndEveryTurn: false,
        checkEndCondition: function(context, lastTurn) {
            //context.expectTable('valid_table');
            // @ts-ignore
            context.expectHash(1868819174);
        },
        databaseConfig: {
            pin_file: images.find(image => -1 !== image.path.default.indexOf("pin.png")).path.default,
            pin_file_mistake: images.find(image => -1 !== image.path.default.indexOf("pin2.png")).path.default,
            map_file: images.find(image => -1 !== image.path.default.indexOf("carteDeFrance.png")).path.default,
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
                blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="dpE`|BKIag-D}N/{9*SA" deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="initHistogram" id="kfwlVB]rYZKNsA:CeM@*"><value name="PARAM_0"><shadow type="math_number" id="?x9XmFHV;ZBZ|Wi8T9v="><field name="NUM">5</field></shadow></value><value name="PARAM_1"><shadow type="math_number" id="`]B(Ko*_H=Cm+{cBmVe*"><field name="NUM">10</field></shadow></value><next><block type="setHistogramBar" id="k#U580=teqj[kf+p9220"><value name="PARAM_0"><shadow type="math_number" id="Qw*EH{u0KB*uMLa(eQBy"><field name="NUM">0</field></shadow></value><value name="PARAM_1"><shadow type="text" id=")=pHSx.,a9b*vshhGfAM"><field name="TEXT">label1</field></shadow></value><value name="PARAM_2"><shadow type="math_number" id="Zdd?Q-uL=_zr#Cg1Y,t*"><field name="NUM">1</field></shadow></value><next><block type="setHistogramBar" id=":j.cWpuCt8I{Hd*ZI1Q+"><value name="PARAM_0"><shadow type="math_number" id="T)Fg9}Hmf[Gx6kAJgRUf"><field name="NUM">1</field></shadow></value><value name="PARAM_1"><shadow type="text" id="{2q@+A0.V*J}dy,XXI,."><field name="TEXT">label2</field></shadow></value><value name="PARAM_2"><shadow type="math_number" id="M06w7~Thg`MxchcmXcyq"><field name="NUM">2</field></shadow></value><next><block type="setHistogramBar" id="8fy/()@D):RBxp;E8.me"><value name="PARAM_0"><shadow type="math_number" id="_V8[-riLJ8u]tX|Z|yFp"><field name="NUM">2</field></shadow></value><value name="PARAM_1"><shadow type="text" id="hrhg*Ex;ZB`3HkXQip8+"><field name="TEXT">label3</field></shadow></value><value name="PARAM_2"><shadow type="math_number" id=";Tl?kLni2K-i:_3Q@c~a"><field name="NUM">8</field></shadow></value><next><block type="setHistogramBar" id="mN:yPK?4B-[R!B/9[RO!"><value name="PARAM_0"><shadow type="math_number" id="j`?V-`spIoLdhe?6VOa`"><field name="NUM">3</field></shadow></value><value name="PARAM_1"><shadow type="text" id="}k5hLZd:*26F[;o*,s_z"><field name="TEXT">label4</field></shadow></value><value name="PARAM_2"><shadow type="math_number" id="h4q8,#!leMR8t8B~.lwL"><field name="NUM">5</field></shadow></value><next><block type="setHistogramBar" id="9jE#[V*~4h)eBIvGNq,i"><value name="PARAM_0"><shadow type="math_number" id="l#txlV[TV2j9MmAA2:*E"><field name="NUM">4</field></shadow></value><value name="PARAM_1"><shadow type="text" id="xAx3edZdtVo#GkBLTqF5"><field name="TEXT">label5</field></shadow></value><value name="PARAM_2"><shadow type="math_number" id="j_X@:D(mu+~O;RCga@fv"><field name="NUM">555</field></shadow></value></block></next></block></next></block></next></block></next></block></next></block></next></block></xml>'

                // blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="cwD?Km9#D6D_9NH{A6z." deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="variables_set" id="a]yR,?2V:Y{m[l@LB21d"><field name="VAR">testTable</field><value name="VALUE"><block type="loadTable" id="fk_p6Sad,f:)m!aga1=/"><value name="PARAM_0"><shadow type="text" id="kzOpIV1e?gT;WG;vkW(0"><field name="TEXT">test_table</field></shadow></value></block></value><next><block type="displayTable" id=",`vFND|DG-thvpo?[!*h"><value name="PARAM_0"><block type="variables_get" id="eX}C#H;I@ep@`krGs._m"><field name="VAR">testTable</field></block></value><value name="PARAM_1"><block type="lists_create_with" id="eJck9xqe(BAu+[+YwNzR"><mutation items="4"></mutation><value name="ADD0"><block type="text" id="~(IMsSdX=oJfbw:F;prx"><field name="TEXT">id</field></block></value><value name="ADD1"><block type="text" id="!vX`z7e]|Vwz)sj*~)dN"><field name="TEXT">image</field></block></value><value name="ADD2"><block type="text" id="s6GeqLT,t)Znb::/f=r;"><field name="TEXT">name</field></block></value><value name="ADD3"><block type="text" id="h!`nE@pJO#)gvd@HEc7U"><field name="TEXT">date</field></block></value></block></value></block></next></block></next></block></xml>'
            }
        }
    },
    data: {
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
    },
} as QuickalgoTask
