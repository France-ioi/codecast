window.taskData = {
  gridInfos: {
    hideSaveOrLoad: false,
    turtleFileName: "turtle.png",
    turtleUpFileName: "turtleup.png",
    defaultMoveAmount: 50,
    actionDelay: 200,
    coords: {
      basic: {x: 150, y: 250},
      easy: {x: 100, y: 100},
      medium: {x: 200, y: 200},
      hard: {x: 200, y: 250}
    },
    includeBlocks: {
      groupByCategory: true,
      generatedBlocks: {
        turtle: ["moveamount", "movebackamount", "turnleftamount", "turnrightamount", "penup", "pendown", "colourvalue"],
      },
      standardBlocks: {
        includeAll: false,
        wholeCategories: [],
        singleBlocks: ["controls_repeat", "procedures_defnoreturn"],
      }
    },
    overlayFileName: "grid5.png",
    turtleStepSize: 0.1,
    maxInstructions: {
      basic: 20,
      easy: 35,
      medium: 40,
      hard: 40
    },
    checkEndEveryTurn: false,
    checkEndCondition: function (context, lastTurn) {
      if (lastTurn) {
        var userImage = context.turtle.invisibleTurtle.drawingContext.getImageData(0, 0, 300, 300);
        var solutionImage = context.turtle.invisibleSolutionTurtle.drawingContext.getImageData(0, 0, 300, 300);
        var len = Math.min(userImage.data.length, solutionImage.data.length);
        var delta = 0;
        var fill = 0;
        var empty = 0;
        // Pixels are in RGBA format.  Only check the Alpha bytes.
        for (var i = 3; i < len; i += 4) {
          // Check the Alpha byte.
          if (Math.abs(userImage.data[i] - solutionImage.data[i]) > 127) {
            delta++;
          }
          if (solutionImage.data[i] > 127)
            fill++;
          else
            empty++;
        }

        if (delta < Math.min(fill, empty) * 0.1) {
          context.success = true;
          throw(window.languageStrings.messages.paintingCorrect);
        } else {
          context.success = false;
          throw(window.languageStrings.messages.paintingWrong);
        }
      }
    },
    computeGrade: function (context, message) {
      var rate = 0;
      if (context.success) {
        rate = 1;
        if (context.nbMoves > 100) {
          rate /= 2;
          message += strings.moreThan100Moves;
        }
      }
      return {
        successRate: rate,
        message: message
      };
    }
  },
  data: {
    basic: [{
      drawSolution: function (turtle) {
        for (var i = 0; i < 3; i++) {
          turtle.move(50);
          turtle.turn(120)
        }
        turtle.move(50);
        for (var i = 0; i < 3; i++) {
          turtle.move(50);
          turtle.turn(120)
        }
        turtle.move(100);
        for (var i = 0; i < 3; i++) {
          turtle.move(50);
          turtle.turn(120)
        }
      },
    }],
    easy: [{
      drawSolution: function (turtle) {
        for (var i = 0; i < 4; i++) {
          turtle.move(50);
          turtle.turn(90)
        }
        turtle.stop_painting();
        turtle.turn(-90);
        turtle.move(100);
        turtle.turn(-90);
        turtle.start_painting();
        for (var i = 0; i < 4; i++) {
          turtle.move(50);
          turtle.turn(90)
        }
        turtle.stop_painting();
        turtle.move(100);
        turtle.turn(-90);
        turtle.start_painting();
        for (var i = 0; i < 4; i++) {
          turtle.move(50);
          turtle.turn(90)
        }
      },
    }],
    medium: [{
      drawSolution: function (turtle) {
        for (var i = 0; i < 4; i++) {
          turtle.turn(-90);
          turtle.move(50)
        }
        turtle.turn(-30);
        for (var i = 0; i < 2; i++) {
          turtle.move(50);
          turtle.turn(-120);
        }
        turtle.stop_painting();
        turtle.move(200);
        turtle.turn(-90);
        turtle.start_painting();
        for (var i = 0; i < 4; i++) {
          turtle.turn(-90);
          turtle.move(50)
        }
        turtle.turn(-30);
        for (var i = 0; i < 2; i++) {
          turtle.move(50);
          turtle.turn(-120);
        }
        turtle.stop_painting();
        turtle.turn(-90);
        turtle.move(100);
        turtle.start_painting();
        for (var i = 0; i < 4; i++) {
          turtle.turn(-90);
          turtle.move(50)
        }
        turtle.turn(-30);
        for (var i = 0; i < 2; i++) {
          turtle.move(50);
          turtle.turn(-120);
        }
      },
    }],
    hard: [{
      drawSolution: function (turtle) {
        for (var i = 0; i < 8; i++) {
          for (var j = 0; j < 4; j++) {
            turtle.move(25);
            turtle.turn(90);
          }
          turtle.turn(45)
        }
        turtle.stop_painting();
        turtle.move(150);
        turtle.start_painting();
        for (var i = 0; i < 8; i++) {
          for (var j = 0; j < 4; j++) {
            turtle.move(25);
            turtle.turn(90);
          }
          turtle.turn(45)
        }
        turtle.stop_painting();
        turtle.move(50);
        turtle.turn(90);
        turtle.move(150);
        turtle.start_painting();
        for (var i = 0; i < 8; i++) {
          for (var j = 0; j < 4; j++) {
            turtle.move(25);
            turtle.turn(90);
          }
          turtle.turn(45)
        }
        turtle.stop_painting();
        turtle.turn(90);
        turtle.move(150);
        turtle.turn(90);
        turtle.move(50);
        turtle.start_painting();
        for (var i = 0; i < 8; i++) {
          for (var j = 0; j < 4; j++) {
            turtle.move(25);
            turtle.turn(90);
          }
          turtle.turn(45)
        }
      },
    }],
  }
};

