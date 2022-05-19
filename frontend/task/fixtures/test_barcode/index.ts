export default {
    gridInfos: {
        context: 'barcode',
        hideSaveOrLoad: false,
        actionDelay: 200,
        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                barcode: [
                    'getPixelLuminosity',
                    'setPixelLuminosity',
                    'width',
                    'height',
                    'printResult'
                ]
            },
            standardBlocks: {
                wholeCategories: ["logic", "loops", "math", "texts", "lists", "dicts", "variables", "functions"],
            }
        },
        maxInstructions: 100,
        checkEndEveryTurn: false,
        checkEndCondition: function(context, lastTurn) {
            context.gradeResult();
        },

        startingExample: {
            easy: {
                // 1d test
                // blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id=")cx~0..LGlEKEfwzna1d" deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="variables_set" id="5TzufX*-wu_FJd?hsOI."><field name="VAR">string</field><value name="VALUE"><block type="text" id="o+dzaX)WtYpGGUk!}Zm:"><field name="TEXT"></field></block></value><next><block type="variables_set" id="G87T~z(9x6cryM{,+Qc3"><field name="VAR">col</field><value name="VALUE"><block type="math_number" id="b=P0hrcYBjeXj+LwE#xm"><field name="NUM">0</field></block></value><next><block type="variables_set" id="M+jxtT!}Bi0RF-*)2_L!"><field name="VAR">firstOne</field><value name="VALUE"><block type="math_number" id="49.G2ZriwoHOO{X/Db+i"><field name="NUM">100</field></block></value><next><block type="variables_set" id="lt?E}+|`XxGuDMwepe,z"><field name="VAR">lastOne</field><value name="VALUE"><block type="math_number" id=":bJQ}BUSlu7G.t{E`b_+"><field name="NUM">0</field></block></value><next><block type="controls_repeat_ext" id="Y*t}zBWnlo4-}BCWVEU{"><value name="TIMES"><shadow type="math_number" id="gvKr43gYoLF71v;N1t~r"><field name="NUM">20</field></shadow></value><statement name="DO"><block type="variables_set" id="F{}RL:L-:/Ku[Yrm~6Sd"><field name="VAR">lum</field><value name="VALUE"><block type="getPixelLuminosity" id="Hh_-~w]y*ZZVgQH|Y{2{"><value name="PARAM_0"><shadow type="math_number" id="AteqHF*AVZ6?5z]-Swoy"><field name="NUM">0</field></shadow><block type="variables_get" id="~v3(8k?Qt2qvK@hyV*nY"><field name="VAR">col</field></block></value><value name="PARAM_1"><shadow type="math_number" id="v[s0gP,dnsL(eLNJIJ7u"><field name="NUM">0</field></shadow></value></block></value><next><block type="controls_if" id="ZSu:6R-C:3U:WVBVl#Rj"><mutation else="1"></mutation><value name="IF0"><block type="logic_compare" id="yu;S~``.EQH;dH7adMGj"><field name="OP">LT</field><value name="A"><block type="variables_get" id="_c5!qo+U:7!Ac?+){C!8"><field name="VAR">lum</field></block></value><value name="B"><block type="math_number" id="U.5r3AY|G6mf`xW6;7_M"><field name="NUM">100</field></block></value></block></value><statement name="DO0"><block type="text_append" id="zGyE_m-]V0:B`KztT5]P"><field name="VAR">string</field><value name="TEXT"><block type="text" id="b6W_naYi}X{g7(jf3lxS"><field name="TEXT">1</field></block></value><next><block type="controls_if" id="NO6!h2PH)kKRPmI5r5RN"><value name="IF0"><block type="logic_compare" id="NiQ]0lbG@XN},}u3XEnO"><field name="OP">EQ</field><value name="A"><block type="variables_get" id="6rMhn)WEj-_#(Pg2{)/]"><field name="VAR">firstOne</field></block></value><value name="B"><block type="math_number" id="tmy/[R)7gsXJ+@[32QuI"><field name="NUM">100</field></block></value></block></value><statement name="DO0"><block type="variables_set" id="jH@gdjFEwIlTGc#S!WO@"><field name="VAR">firstOne</field><value name="VALUE"><block type="variables_get" id=")_y[]?v274XqJHOZg18/"><field name="VAR">col</field></block></value></block></statement><next><block type="variables_set" id=")Rm3T*/~rgGVGV/EuoPU"><field name="VAR">lastOne</field><value name="VALUE"><block type="variables_get" id="xr{N8w!v)jJHU4YPJ3VQ"><field name="VAR">col</field></block></value></block></next></block></next></block></statement><statement name="ELSE"><block type="text_append" id="vhA6!ZDuS[ILKzk*q@kX"><field name="VAR">string</field><value name="TEXT"><block type="text" id="!{AEjyZJLWV;,EUAAeo-"><field name="TEXT">0</field></block></value></block></statement><next><block type="math_change" id="*#gW0WX@Jre*D+gkG5.r"><field name="VAR">col</field><value name="DELTA"><shadow type="math_number" id="*LP7]5S;K~:6LR9P]3x#"><field name="NUM">1</field></shadow></value></block></next></block></next></block></statement><next><block type="math_change" id="fGb,dy/{PQ4+uES]|JUl"><field name="VAR">firstOne</field><value name="DELTA"><shadow type="math_number" id="f/8iem|A-Yas3A,#hOd`"><field name="NUM">1</field></shadow></value><next><block type="math_change" id="17@NJo3xSL]IS0nx#khn"><field name="VAR">lastOne</field><value name="DELTA"><shadow type="math_number" id="0pp-W-:PBl*ukc.q+rwm"><field name="NUM">1</field></shadow></value><next><block type="printResult" id=".Yc4dyx=YM36-BtYuI?4"><value name="PARAM_0"><shadow type="text" id="}rS`::UC+]G/e*D]WP`r"><field name="TEXT"></field></shadow><block type="text_getSubstring" id="gzOZ6?;=2.EurRC(o]zm"><mutation at1="true" at2="true"></mutation><field name="WHERE1">FROM_START</field><field name="WHERE2">FROM_START</field><value name="STRING"><block type="variables_get" id="X}E3pTmbl2Ni5Oz_N*i}"><field name="VAR">string</field></block></value><value name="AT1"><block type="variables_get" id="B(o_Ei{k4RBE}~O!NZ.."><field name="VAR">firstOne</field></block></value><value name="AT2"><block type="variables_get" id="BwvD#xcZz[mmcgzndnZ#"><field name="VAR">lastOne</field></block></value></block></value></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></next></block></xml>'

                // 2d test
                blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id=")cx~0..LGlEKEfwzna1d" deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="variables_set" id="oH!Wy0-tgBDZX}gG}r}E"><field name="VAR">y</field><value name="VALUE"><block type="math_number" id="8knSe|S73n+gGfRo5#8m"><field name="NUM">0</field></block></value><next><block type="controls_repeat_ext" id="cJ2?:=8Rz}V5+c{_`4@+"><value name="TIMES"><shadow type="math_number" id="~)eM,[PU9WTjtA`deD4R"><field name="NUM">9</field></shadow></value><statement name="DO"><block type="variables_set" id="v#|B93ayCU)k~Kgbz}BT"><field name="VAR">x</field><value name="VALUE"><block type="math_number" id="1HTQsf.BGoI4AyPHAGCC"><field name="NUM">0</field></block></value><next><block type="controls_repeat_ext" id="Y*t}zBWnlo4-}BCWVEU{"><value name="TIMES"><shadow type="math_number" id="gvKr43gYoLF71v;N1t~r"><field name="NUM">20</field></shadow></value><statement name="DO"><block type="variables_set" id="F{}RL:L-:/Ku[Yrm~6Sd"><field name="VAR">lum</field><value name="VALUE"><block type="getPixelLuminosity" id="Hh_-~w]y*ZZVgQH|Y{2{"><value name="PARAM_0"><shadow type="math_number" id="AteqHF*AVZ6?5z]-Swoy"><field name="NUM">0</field></shadow><block type="variables_get" id="h7Gc{7=GRx_Um_=3c,RX"><field name="VAR">x</field></block></value><value name="PARAM_1"><shadow type="math_number" id="v[s0gP,dnsL(eLNJIJ7u"><field name="NUM">0</field></shadow><block type="variables_get" id="4iLJ6oOAP6SoE061R@h6"><field name="VAR">y</field></block></value></block></value><next><block type="controls_if" id="ZSu:6R-C:3U:WVBVl#Rj"><mutation else="1"></mutation><value name="IF0"><block type="logic_compare" id="yu;S~``.EQH;dH7adMGj"><field name="OP">LT</field><value name="A"><block type="variables_get" id="_c5!qo+U:7!Ac?+){C!8"><field name="VAR">lum</field></block></value><value name="B"><block type="math_number" id="U.5r3AY|G6mf`xW6;7_M"><field name="NUM">100</field></block></value></block></value><statement name="DO0"><block type="setPixelLuminosity" id="Hvp1#}s}Z#OcdegaI:;i"><value name="PARAM_0"><shadow type="math_number" id="FxoMHgJ/?x;~cPi=OW0F"><field name="NUM">0</field></shadow><block type="variables_get" id="tc.aiyXoeEdcyBJ](f/:"><field name="VAR">x</field></block></value><value name="PARAM_1"><shadow type="math_number" id="=,6)kRm!{zZAj8a=_+Z["><field name="NUM">0</field></shadow><block type="variables_get" id="x,nPJe8s5fVVgI*bP1N,"><field name="VAR">y</field></block></value><value name="PARAM_2"><shadow type="math_number" id="}Tb2(BK1]9Cp=*={v|H{"><field name="NUM">0</field></shadow></value></block></statement><statement name="ELSE"><block type="setPixelLuminosity" id="A96YSEx73:y:L+DziDtC"><value name="PARAM_0"><shadow type="math_number" id="FxoMHgJ/?x;~cPi=OW0F"><field name="NUM">0</field></shadow><block type="variables_get" id=",4-?r*aA}zojI,UrdF[t"><field name="VAR">x</field></block></value><value name="PARAM_1"><shadow type="math_number" id="=,6)kRm!{zZAj8a=_+Z["><field name="NUM">0</field></shadow><block type="variables_get" id="tv}V0j9_Qg#IfDqVu[1;"><field name="VAR">y</field></block></value><value name="PARAM_2"><shadow type="math_number" id="PkN`l){h?bVSIuz@EJ-="><field name="NUM">255</field></shadow></value></block></statement><next><block type="math_change" id="*p*8?sjNgCNwBd)b5Xfz"><field name="VAR">x</field><value name="DELTA"><shadow type="math_number" id="R`t(S3,/=N8R[y:?=a7]"><field name="NUM">1</field></shadow></value></block></next></block></next></block></statement><next><block type="math_change" id="#qIvl6q~t(@lhlOv-_cV"><field name="VAR">y</field><value name="DELTA"><shadow type="math_number" id="caf/9Pn/zjtAL/bCr9jf"><field name="NUM">1</field></shadow></value></block></next></block></next></block></statement></block></next></block></next></block></xml>'
            }
        },
    },
    data: {
        easy: [

            {
                valid_result: {
                    type: 'array',
                    data: [
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                        [255,255,255,0,255,0,0,255,0,255,255,0,255,0,255,255,0,255,255,255],
                    ],
                    threshold: 5
                },
                user_display: {
                    width: 20,
                    height: 9
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAJCAYAAAAywQxIAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABLSURBVChTY3j48OF/GDYxMfl/8+bN/wEBAWD89OnT/y4uLv+fP38OxtHR0WAxOzu7/zdu3ABjNTU1sBgMMzFQGYwaSDkYcQYyMAAAyjc72weRpLAAAAAASUVORK5CYII='
            },
            {
                valid_result: {
                    type: 'array',
                    data: [
                        [255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                    ],
                    threshold: 5
                },
                user_display: {
                    width: 20,
                    height: 9
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAJCAYAAAAywQxIAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABLSURBVChTY3j69Ol/GFZTU/t/48YNMLazswOLRUdH/3/+/DkYP3z48L+LiwtYPCAgAIxv3rz538TEBCwHwkwMVAajBlIORpyBDAwAHr4722FJumkAAAAASUVORK5CYII='
            },
        ],
        medium: [
            {
                valid_result: {
                    type: 'string',
                    data: '101101001010010001'
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAAbCAYAAAAgVez8AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAACBSURBVFhH7c+hEYMhAIPRtANiUCiW4I4d8BgsxxzMwiStiUH06vPnmcR+r3POB3/EGPmAtRYfUGvlu/Xe+YCcMx8w5+S7lVL4gNYaH5BS4gPGGHy3EAIfsPfm++3NfQwHq3OwOgerc7A6B6tzsDoHq3OwOgerc7A6B6tzsLqHBQNfQlsV5K9k1nsAAAAASUVORK5CYII='
            },
            {
                valid_result: {
                    type: 'string',
                    data: '101101001010010001'
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAkCAYAAAAeor16AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAACsSURBVGhD7dChFcMwEARRJ52pFr9nIq4qRFyCkLl7chMiCbiDBk6Gzie7eF7XdX2WH5RS8oXzPPPd27YtXziOI19oreULvfd89+ac+cK6rvnCGCNfqLXme2bf93zPvHP1JwNCBoQMCBkQMiBkQMiAkAEhA0IGhAwIGRAyIGRAyICQASEDQgaEDAgZEDIgZEDIgJABIQNCBoQMCBkQMiBkQMiAkAEhA0IGRJblCy+OFer2KEwEAAAAAElFTkSuQmCC'
            },
            {
                valid_result: {
                    type: 'string',
                    data: '101101001010010001'
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAASCAYAAAApH5ymAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAABzSURBVEhL7c6hDcAgFIRh2t2YAkmCYQM2IGEJFArDTixBSNrkElzdmYr7xfvku2vO+ZiP9t7Qew9rrTDGCE85Z+icg713aK2FYwx4CiHA1ho8f1JKsJQC11rwxv1xGsimgWwayKaBbBrIpoFsGsimgVzGvMH3HsbV8i0aAAAAAElFTkSuQmCC'
            },
        ],
        hard: [
            {
                valid_result: {
                    type: 'string',
                    data: '1001100100010010000011111000101010101110'
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAAbCAYAAAAgVez8AAAACXBIWXMAABJ0AAASdAHeZh94AAAAcElEQVRYhe3PsQ3AIAxE0STDITEHI1C6pmQE5kBiuaRzZUT/c6+6wi7+XUp5r4Mxhu+cs+85Z3hfa/Xde/dtZuF9a+34m1IKf9da4e/Oc7yAUTCdgukUTKdgOgXTKZhOwXQKplMwnYLpFEynYLrfBX9rexSOBFP0lQAAAABJRU5ErkJggg=='
            },
            {
                valid_result: {
                    type: 'string',
                    data: '1001100100010010000011111000101010101110'
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAkCAYAAAAeor16AAAACXBIWXMAABJ0AAASdAHeZh94AAAApklEQVRoge3QMQoDIRQG4SR3sbDawgt48b2DWNjsTWxM/RIQZNr5uh8eIvOec67Xgfu+w661bu9ba2GXUsJ+nifslNL2vbXid3vvYV/XFfYYY/ver5zz0f3n6Fp/DAgZEDIgZEDIgJABIQNCBoQMCBkQMiBkQMiAkAEhA0IGhAwIGRAyIGRAyICQASEDQgaEDAgZEDIgZEDIgJABIQNCBoQMCBkQ+gJtYRYyVJalFQAAAABJRU5ErkJggg=='
            },
            {
                valid_result: {
                    type: 'string',
                    data: '1001100100010010000011111000101010101110'
                },
                image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAASCAYAAAApH5ymAAAACXBIWXMAABJ0AAASdAHeZh94AAAAc0lEQVRIie3OoQ3DMBCG0deO4h0ihRpmXm+QAQwCMkeIQVCLCiyFHSm4B0+/dN/ruq6PB/d9g2VZwHEcYF3Xaddam+7neYJSCui9T/ta67T7/dm2Dez7DsYY4P0U908yMCoDozIwKgOjMjAqA6MyMCoDo760Xh7eFQ3byQAAAABJRU5ErkJggg=='
            }
        ]
    }
}
