import {QuickalgoTask} from '../../task_types';

const images = [
    {path: require('./img/carteDeFrance.png')},
    {path: require('./img/pin.png')},
];

export default {
    gridInfos: {
        context: 'map',
        importModules: ['blockly_map', 'map', 'logger'],
        images,
        hideSaveOrLoad: false,
        actionDelay: 200,
        buttonScaleDrawing: false,
        conceptViewer: true,
        hideValidate: true,

        includeBlocks: {
            groupByCategory: false,
            generatedBlocks: {
                map: [
                    'clearMap',
                    'addLocation',
                    'addRoad',
                    'geoDistance',
                    'getLatitude',
                    'getLongitude',
                    'getNeighbors',
                    'shortestPath',
                    'echo'
                ]
            },
            standardBlocks: {
                includeAll: false
            }
        },
        maxInstructions: 100,
        checkEndEveryTurn: false,
        checkEndCondition: function(context, lastTurn) {
            context.success = false;
            // throw("complete");
        },
        mapConfig: {
            map_lng_left: -4.85,
            map_lng_right: 9.65,
            map_lat_top: 51.6,
            map_lat_bottom: 41.7,
            // map2d options
            pin_file:  images.find(image => -1 !== image.path.default.indexOf("pin.png")).path.default,
            map_file:  images.find(image => -1 !== image.path.default.indexOf("carteDeFrance.png")).path.default,
        },


        startingExample: {
            easy: {
                blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="l,=*_AYYqG_(Tcv44d)}" deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="addLocation" id="hbVb[JZxBtX*3ql*G7Pj"><value name="PARAM_0"><shadow type="math_number" id="I+EMItINPHJ3?0C73v~W"><field name="NUM">6</field></shadow></value><value name="PARAM_1"><shadow type="math_number" id="KnQHMWD7Zw!}|(HD5ozC"><field name="NUM">50</field></shadow></value><value name="PARAM_2"><shadow type="text" id=".R9}LAFZ0V?VZxqAC=*`"><field name="TEXT">2</field></shadow></value><next><block type="addLocation" id="cqs5v9q1eF,RuHNh1TmW"><value name="PARAM_0"><shadow type="math_number" id="c#/[i,lPO`Qr+JR)/=_7"><field name="NUM">1</field></shadow></value><value name="PARAM_1"><shadow type="math_number" id="?=C*eTRL6J6]8aLyD-X["><field name="NUM">42</field></shadow></value><value name="PARAM_2"><shadow type="text" id="_c8a,8?K`k-;K.A{:8oJ"><field name="TEXT">1</field></shadow></value><next><block type="addRoad" id="*1V[@!PkQxq|kbs5x#5_"><value name="PARAM_0"><shadow type="math_number" id="UmfWfh.G`+_H1A3D9=~m"><field name="NUM">6</field></shadow></value><value name="PARAM_1"><shadow type="math_number" id=",3lI.O:(OmO:h7bClIgO"><field name="NUM">50</field></shadow></value><value name="PARAM_2"><shadow type="math_number" id="aPA#m~(rnG;.!({]yNFY"><field name="NUM">1</field></shadow></value><value name="PARAM_3"><shadow type="math_number" id="@;k23;i.,feCy]f4[:|o"><field name="NUM">42</field></shadow></value><value name="PARAM_4"><shadow type="math_number" id="B)0HH2f1D#ISpZOE8Qt("><field name="NUM">0.5</field></shadow></value></block></next></block></next></block></next></block></xml>'
            }
        }
    },
    data: {
        easy: [{}]
    }
} as QuickalgoTask
