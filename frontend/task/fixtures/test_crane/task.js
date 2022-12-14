function initTask(subTask) {
   subTask.gridInfos = {
      conceptViewer: ["extra_list"],
      showLabels: true,
      rowLabelEnabled: false,
      showContLabels: true,
      showContOutline: true,
      contextType: "default",
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
            robot: ["left", "right", "take", "drop"]
         },
         standardBlocks: {
            includeAll: false,
            // wholeCategories: ["variables"],
            singleBlocks: ["controls_repeat"]
            // singleBlocks: ["lists_create_with_empty", "lists_repeat", "lists_getIndex", "lists_setIndex", "controls_repeat_ext", "controls_whileUntil", "controls_if", "controls_if_else", "math_number", "math_arithmetic", "logic_compare", "logic_boolean", "logic_negate"]
         },
         // procedures: { disableArgs: true }
      },
      intro: {
         default: false
      }
   };

   subTask.data = {   
      easy: [
         {
            container: [
               [1,1,1],
               [2,3,1],
               [2,3,4]
            ],
            tiles: [
                [ 1, 1, 1, 1, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 1, 1],
                [ 3, 1, 1, 1, 1, 1, 1]
            ],
            target: [
                [ 1, 1, 1, 1, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 1, 1],
                [ 1, 1, 1, 3, 1, 1, 1]
            ],
            initItems: [
                  // { row: 8, col: 0, dir: 0, type: "robot" },
               ],
               initCranePos: 0
         }
      ],
      medium: [
         {
            tiles: [
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [ 2, 3, 1, 1, 1, 1, 1, 1, 1, 1],
                [ 2, 3, 4, 3, 1, 1, 1, 1, 1, 1]
            ],
            target: [
                [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 1, 4, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 2, 2, 1, 1, 1],
                [ 1, 1, 1, 1, 1, 3, 3, 3, 1, 1]
            ],
            initItems: [
                  // { row: 8, col: 0, dir: 0, type: "robot" },
               ],
               initCranePos: 0
         }
      ]
   };

   createAlgoreaInstructions(subTask);

   initBlocklySubTask(subTask);
   displayHelper.thresholdEasy = 5000;
   displayHelper.thresholdMedium = 10000;
   displayHelper.avatarType = "none";
}

initWrapper(initTask, ["easy", "medium"/*, "hard"*/], null, true);
