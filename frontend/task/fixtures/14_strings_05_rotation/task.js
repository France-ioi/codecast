var subTask = {
  gridInfos: {
    context: 'printer',
    hideSaveOrLoad: true,
    conceptViewer: true,
    actionDelay: 200,
    maxIterWithoutAction: 5000,
    includeBlocks: {
      groupByCategory: false  ,
      generatedBlocks: {
        printer: ["print","read"]
      },
      standardBlocks: {
        includeAll: false,
        wholeCategories: {
          easy: ["variables"],
          medium: ["variables"],
          hard: ["variables"]
        },
        singleBlocks: ["text", "logic_compare", "controls_if_else","controls_repeat","lists_repeat", "lists_getIndex", "lists_setIndex","text_length","text_join","text_charAt"]
      },
      variables: {
      },
      pythonAdditionalFunctions: ["len"]
    },
    maxInstructions: {easy:40, medium:40, hard: 100},
    checkEndEveryTurn: false,
    checkEndCondition: function(context, lastTurn) {
      if (!lastTurn) return;

      // throws, if something is wrong …
      context.checkOutputHelper();

      // Seems like everything is okay: Right number of lines and all lines match …
      context.success = true;
      throw(window.languageStrings.messages.outputCorrect);
    },
    computeGrade: function(context, message) {
      var rate = 0;
      if (context.success) {
        rate = 1;
        if (context.nbMoves > 100) {
          rate /= 2;
          message += languageStrings.messages.moreThan100Moves;
        }
      }
      return {
        successRate: rate,
        message: message
      };
    }
  },
  data: {
    easy: [
      {
        input: "grecon\nenghar\nennejuli\nlanmer\nbottur\nonth\nnettesaumo\neuli\nroiebaud\nvevi\n",
        output: "congre\nhareng\njulienne\nmerlan\nturbot\nthon\nsaumonette\nlieu\nbaudroie\nvive\n"
      }
    ],
    medium: [
      {
        input: "ndeama\norneaubig\notbul\nuecoq\nteaucou\nsinour\nourdepal\nonclepét\nirepra\nlinetel\n",
        output: "amande\nbigorneau\nbulot\ncoque\ncouteau\noursin\npalourde\npétoncle\npraire\ntelline\n"
      }
    ],
    hard: [
      {
        input: "néegraia\nleaigc\ntteerevc\nssesicrevé\nesbrac\nasbamg\nstesuangol\neautourt\ntinessangoul\nlesltrié\n",
        output: "araignée\ncigale\ncrevette\nécrevisses\ncrabes\ngambas\nlangoustes\ntourteau\nlangoustines\nétrilles\n"
      }
    ],
  },
}

setTimeout(() => {
  Codecast.start({
    "start": "task",
    "showStepper": true,
    "showStack": true,
    "showViews": true,
    "showIO": true,
    "platform": "python",
    "canChangePlatform": true,
    "controls": {"": "+"},
    // "baseUrl": "https://codecast-dev.france-ioi.org/next",
    // "callbackUrl": "/next/task",
    "baseUrl": "",
    "callbackUrl": "",
    "referer": null,
    "authProviders": ["guest"],
    "user": false,
    "task": subTask,
  })
}, 0);


