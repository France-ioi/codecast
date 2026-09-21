# Codecast contexts of usage

Codecast is a tool in which a user can solve a programming task. The difficulty of working with it
is that it can be used in a lot of different contexts. This document aims at listing (most of) them
so that future developers can understand better the constraints that apply to any modification.

## Server mode / client mode

Codecast can be used as client-side application: it is then loaded as a JavaScript library inside
a task defined by an `index.html`.

Codecast can also be used as a server-side application. In that case, the application
is given a taskId and loads this task from [CodecastTaskBackend](https://github.com/France-ioi/CodecastTaskBackend).
In this case, the information from the `index.html` is imported via https://github.com/France-ioi/fioi-task-importer
into the CodecastTaskBackend database.

## On a platform / in local files

Codecast is mainly used inside https://github.com/France-ioi/AlgoreaFrontend: the task is displayed inside
a platform such as https://parcours.algorea.org and interacts with it through the Bebras task-platform API.

Alternatively, it can be used in a standalone mode, without the context of a platform. In such a case,
Codecast uses the views tab system provided by the JavaScript lib miniPlatform.

## Task contexts

There are a lot of task contexts that can be used with Codecast. These contexts correspond
to libraries contained inside https://github.com/France-ioi/bebras-modules/tree/master/pemFioi. Here are
a few examples:

### Robot

In this context, the user has to code a robot that will solve a problem and can see the robot
moves on a grid.

There are a lot of subcontexts: sokoban, paint, course, etc...

Task examples:
- Algorea/algorea_training_2/11_variable_08_sokoban (sokoban)
- Algorea/algorea_training_2/11_variable_02_paint (paint)

### Quickpi/Microbit/Galaxia

In this context, the user has to code a connected board that can be virtual (simulated) or real.

The context visualization is the board itself, where the user can see the captors and click on the actuators.

Task examples:
- IMTAtlantique/galaxia-le-lampadaire (Galaxia)
- QuickPi/microbit-test (Microbit)
- QuickPi/ParcoursA.1/4-afficher-la-direction (Quickpi)

### Printer

In this context, each test has an input and an expected output. The
user will write code that will consume the input and must
produce the expected output.

The context visualization is:
- the input
- the user program output
- the expected output

Note that by default, they are displayed one below the other, but there is an option to display 
them side by side (`printerLibColumn`).

Task examples:
- Algorea/algorea_training_2/14_strings_03_split

### Turtle

It's the same principe as the robot library, just another
example of a lib implement a context visualization as a grid.

Task examples:
- Algorea/algorea_turtle/turtle_01_sequence_03

### Smart contracts

In this context, the user has to code a smart contract.

Task examples:
- Tezos/single_nft

## Programming languages

Codecast must be used both with textual programming languages (C++, Python...)
and block languages (Blockly, Scratch).

Use `?platform=blockly` or `?platform=python` to test both.

## Client-side execution / server-side execution and tests

Codecast can be used both in a client-side execution
(the program is run inside the browser or run distantly but its execution
displays in real time inside the browser)
or server-side execution (the code is submitted to a task grading service
that returns only the grading result at the end of the execution).
It can also provide both modes.

The task can define example (client) tests, that will be accessible
to users. If the task has client-side execution, he can run his program
on these tests. The task can also define server-side tests, that
are not accessible to users, he can run his program server-side
on those tests.

Task examples:
- Algorea/algorea_training_2/14_strings_03_split (only client-side)
- Algorea/algorea_transitions/tombola_1 (both client and server-side)
- Tezos/single_nft (only server-side)

## Language

Codecast is international, and everything must be translated in all the
languages that Codecast supports.

Use `?language=de-DE` e.g. to test the German version

## Theming

Codecast display can have different themes.

Examples:
- Add `?theme=coursera` to see the Coursera theme

## Version levels

Some tasks have multiple versions of increasing difficulty: basic, easy, medium, hard (or a subset of those).

The user can switch difficulty using a tab system. He keeps his current program in each difficulty when he switches.

Task examples:
- Algorea/algorea_training_2/11_variable_08_sokoban

Note that there are no server-side execution tasks with multiple versions: this case is not supported.
Versions can only be used for client-side execution tasks.

## With code tabs / without code tab

By default, Codecast is used without code tabs. There is an option (`tabsEnabled: true` in `gridInfos`)
to give the user the ability to create multiple code tabs to help him solve the task. In this case, the user can switch between
the code tabs. When viewing submission results, the user can open the code corresponding
to a past submission in a separate read-only code tab, and duplicate it. He can change the programming
language of each tab.

Task examples:
- FranceIOI/WithGen/sorting_extractions

## Layout

Codecast has a lot of options to customize the layout of the task: see all of them in `parameters.md`.

Task examples:
- Algorea/algorea_transitions/tombola_1 (long instructions open by default and collapsable, no views)
- Algorea/algorea_training_2/11_variable_08_sokoban (tab system for versions)
- Tezos/single_nft (views system with tabs: Task / Edit)
- FranceIOI/Programming/Sequence/hello_world/ (views system with tabs: Task / Edit / Solution)
- FranceIOI/WithGen/sorting_extractions/ (code tabs enabled)

## Solve mode / recording mode / edit recording mode / replay recording mode

By default, Codecast is in solve mode.

The user can enter in recording mode (by adding `?record` the URL). Then he can record his actions
on Codecast, such as writing code, running its code, seeing results, etc... He can then
edit his recording, and replay its recording (including giving the recording link to others
so that they can watch the recording, for learning purposes).

The recording / replay mode add overlays to the Codecast interface with specific controls for each case.

## Read-only / editable

By default, Codecast is in editable mode. Codecast can be executed in read-only mode (this mode can be
set when the platform reloads an answer from another user). In this case, the editors are disabled, and
the user cannot make a new submission.
