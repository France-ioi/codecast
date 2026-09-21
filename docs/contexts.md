# Codecast contexts of usage

Codecast is a tool in which a user can solve a programming task. The difficulty of working with it
is that it can be used in a lot of different contexts. This document aims at listing (most of) them
so that future developers can better understand the constraints that apply to any modification.

Most of these contexts can be combined (e.g. a Blockly robot task with versions, in German, inside a platform),
so a change should be checked against as many combinations as reasonably possible.

## Server mode / client mode

Codecast can be used as a client-side application: it is then loaded as a JavaScript library inside
a task defined by an `index.html`.

Codecast can also be used as a server-side application. In that case, the application
is given a taskId and loads this task from [CodecastTaskBackend](https://github.com/France-ioi/CodecastTaskBackend).
The information from the `index.html` is imported via [fioi-task-importer](https://github.com/France-ioi/fioi-task-importer)
into the CodecastTaskBackend database.

## On a platform / in local files

Codecast is mainly used inside [AlgoreaFrontend](https://github.com/France-ioi/AlgoreaFrontend): the task is displayed inside
a platform such as https://parcours.algorea.org and interacts with it through the Bebras task-platform API.

Alternatively, it can be used in a standalone mode, without the context of a platform. In such a case,
Codecast uses the views tab system provided by the JavaScript lib miniPlatform (from bebras-modules).

## Task contexts

There are a lot of task contexts that can be used with Codecast. These contexts correspond
to libraries contained inside [bebras-modules/pemFioi](https://github.com/France-ioi/bebras-modules/tree/master/pemFioi)
(some of them are reimplemented or extended in `frontend/task/libs`). Here are a few examples:

### Robot

In this context, the user has to code a robot that will solve a problem, and can see the robot
move on a grid.

There are a lot of subcontexts: sokoban, paint, course, etc.

Task examples:
- Algorea/algorea_training_2/11_variable_08_sokoban (sokoban)
- Algorea/algorea_training_2/11_variable_02_paint (paint)

### Quickpi/Microbit/Galaxia

In this context, the user has to code a connected board that can be virtual (simulated) or real.

The context visualization is the board itself, where the user can see the sensors and click on the actuators.

Task examples:
- IMTAtlantique/galaxia-le-lampadaire (Galaxia)
- QuickPi/microbit-test (Microbit)
- QuickPi/ParcoursA.1/4-afficher-la-direction (Quickpi)

### Printer

In this context, each test has an input and an expected output. The
user writes code that consumes the input and must
produce the expected output.

The context visualization is:
- the input
- the user program output
- the expected output

Note that by default, they are displayed one below the other, but there is a Codecast option to display
them side by side (`printerLibColumn`).

Task examples:
- Algorea/algorea_training_2/14_strings_03_split

### Turtle

It follows the same principle as the robot library: it is another
example of a library implementing a context visualization as a grid.

Task examples:
- Algorea/algorea_turtle/turtle_01_sequence_03

### Smart contracts

In this context, the user has to code a smart contract.

Task examples:
- Tezos/single_nft

## Programming languages

Codecast must work both with textual programming languages (Python, C, C++, Java...)
and block languages (Blockly, Scratch). The full list is in `frontend/stepper/codecast_platform.ts`.

Use `?platform=blockly`, `?platform=scratch` or `?platform=python` to test them.

## Client-side execution / server-side execution and tests

Codecast can be used with client-side execution
(the program runs inside the browser, or runs remotely but its execution
is displayed in real time inside the browser)
or server-side execution (the code is submitted to a task grading service
that only returns the grading result at the end of the execution).
A task can also provide both modes.

The task can define example (client) tests that are visible
to users. If the task has client-side execution, the user can run their program
on these tests. The task can also define server-side tests, which
are hidden from users: they can only submit their program to be evaluated
server-side on those tests.

Task examples:
- Algorea/algorea_training_2/14_strings_03_split (only client-side)
- Algorea/algorea_transitions/tombola_1 (both client and server-side)
- Tezos/single_nft (only server-side)

## Language

Codecast is international, and every string must be translated in all the
languages that Codecast supports: currently `en-US`, `fr-FR`, `nl-BE` and `de-DE`
(see `frontend/lang`).

Use e.g. `?language=de-DE` to test the German version.

## Theming

Codecast display can have different themes, defined in `frontend/task/task.scss`.

Examples:
- Add `?theme=coursera` to see the Coursera theme
- Add `?theme=tralalere` to see the Tralalère theme

## Version levels

Some tasks have multiple versions of increasing difficulty: basic, easy, medium, hard (or a subset of those).

The user can switch difficulty using a tab system. Their current program is kept for each difficulty when they switch.

Use `?level=easy,medium` to restrict the available levels, or `?defaultLevel=medium` to choose the initial one.

Task examples:
- Algorea/algorea_training_2/11_variable_08_sokoban

Note that there are no server-side execution tasks with multiple versions: this case is not supported.
Versions can only be used for client-side execution tasks.

## With code tabs / without code tabs

By default, Codecast is used without code tabs. There is an option (`tabsEnabled: true` in `gridInfos`)
that lets the user create multiple code tabs to help them solve the task. In this case, the user can switch between
the code tabs, and can change the programming language of each tab. When viewing submission results,
the user can open the code corresponding to a past submission in a separate read-only code tab, and duplicate it.

Task examples:
- FranceIOI/WithGen/sorting_extractions

## Interface

Codecast has a lot of options to customize the interface of the task: see all of them in `parameters.md`.

Task examples:
- Algorea/algorea_transitions/tombola_1 (long instructions open by default and collapsible, no views)
- Algorea/algorea_training_2/11_variable_08_sokoban (tab system for versions)
- Tezos/single_nft (views system with tabs: Task / Edit)
- FranceIOI/Programming/Sequence/hello_world/ (views system with tabs: Task / Edit / Solution)
- FranceIOI/WithGen/sorting_extractions/ (code tabs enabled)

## Multi-device

Codecast must be usable:
- in desktop
- in mobile vertical
- in mobile horizontal
- in tablet

A dedicated layout is used for each of these 4 modes.

## Solve mode / recording mode / edit recording mode / replay recording mode

By default, Codecast is in solve mode.

The user can enable recording (by adding `?record` to the URL). They can then record their actions
in Codecast, such as writing code, running it, seeing results, etc. along with their voice.
They can then edit their recording, and replay it (including giving the recording link to others
so that they can watch it, for learning purposes).

A recording is opened with `?recording=<recording URL>`: it is replayed by default,
and opened in edit mode with `&mode=edit`.

The recording / replay modes add overlays to the Codecast interface with specific controls for each case.

## Read-only / editable

By default, Codecast is in editable mode. Codecast can be executed in read-only mode (this mode can be
set when the platform reloads an answer from another user). In this case, the editors are disabled, and
the user cannot make a new submission.
