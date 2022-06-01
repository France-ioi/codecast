function initTask(subTask) {

    subTask.gridInfos = {
        hideSaveOrLoad: false,
        actionDelay: 200,
        buttonScaleDrawing: false,
        conceptViewer: true,
        //hideValidate: false,

        includeBlocks: {
            groupByCategory: true,
            generatedBlocks: {
                p5: [
                    'playSignal',
                    'playRecord',
                    'playStop',
                    'sleep',
                    'echo'
                ]
            },
            standardBlocks: {
                includeAll: true
            }
        },
        maxInstructions: 100,
        checkEndEveryTurn: false,
        checkEndCondition: function(context, lastTurn) {
            context.success = false;
            //throw(strings.complete);
        },
        example: {
            blockly: '<xml xmlns="http://www.w3.org/1999/xhtml"><block type="robot_start" id="/!+x4*tEFB+!6,qgRKR(" deletable="false" movable="false" editable="false" x="0" y="0"><next><block type="playRecord" id="LL?*@/DSOfin)=1sex?d"><value name="PARAM_0"><shadow type="text" id="YC#uKWxWrfIO:PtcMrKy"><field name="TEXT">1</field></shadow></value><value name="PARAM_1"><shadow type="math_number" id="7+4(13Dp,!L;vO2#CVl,"><field name="NUM">1111</field></shadow></value><next><block type="sleep" id="cg+Hk?w3vj{/{k1i(fJa"><value name="PARAM_0"><shadow type="math_number" id="CiY@y*[KHHw@X1[k?h3q"><field name="NUM">1111</field></shadow></value></block></next></block></next></block></xml>'
        }
    }

    subTask.data = {
        easy: [{}]
    }
    initBlocklySubTask(subTask)
}
initWrapper(initTask, null, null)
