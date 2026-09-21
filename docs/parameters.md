# Codecast parameters

## URL parameters

*Example for the Coursera platform:*

[https://codecast.france-ioi.org/v7/task?recording=https%3A%2F%2Ffioi-recordings.s3.amazonaws.com%2Fdartmouth%2F1517868322553&platform=unix&theme=coursera&noDoc](https://codecast.france-ioi.org/v7/task?recording=https%3A%2F%2Ffioi-recordings.s3.amazonaws.com%2Fdartmouth%2F1517868322553&platform=unix&theme=coursera&noDoc)

We add to the URL `&platform=unix&theme=coursera&noDoc`.

If you find `amp;` in the URL, this is a copy-pasting error from an `&`. You should erase `amp;`.

| Option | Usage |
| :---- | :---- |
| **noDoc** | hide the documentation from the interface (default value: false) |
| **theme** | apply different themes: coursera or FUN design / colors (default value: france-ioi theme - other values: coursera or funtelecom) |
| **noFullScreen** | hide the full screen button from the interface (default value: false) |
| **directives** | show the directive blocks in the action blocks menu (default value: false) |
| **record** | show the record button in the menu on the right (default value: false) |
| **sLocale** | set the preferred interface language (options: fr or en) |
| **language** | set the preferred interface language (options: fr-FR or en-US) |
| **level** | set the enabled levels, separated by a comma to enable multiple levels (options: basic, easy, medium, hard) |
| **defaultLevel** | set the level which will be loaded by default, if existing (options: basic, easy, medium, hard) |
| **noLanguageChange** | hide the language change option in the settings |
| **platform** | set the platform language (options: unix, python, arduino) and hide the platform change option in the settings *(legacy behaviour)* |
| **source** | set the initial source code |
| **noStepper** | hide the stepper, stack, views and input/output from the interface (default value: false, *legacy behaviour*) |
| **noStack** | hide the variables stack from the interface (default value: false) |
| **noMenu** | hide the menu on the right (with settings, recorder, etc.) |
| **noSettings** | hide the settings in the menu on the right |
| **noViews** | hide all the user-defined visualizations from the interface (default value: false) |
| **noIO** | hide the terminal or input/output from the interface (default value: false) |
| **noDownload** | disable the possibility of downloading the recording (default value: false) |
| **mode** | set the view mode of the recording, use `edit` to use the editor (options: edit, view; default value: view) |
| **stepperControls** | make it possible to hide specific stepper controls. Use `_` before a control to hide it, and use `-` to show it disabled. Separate controls by a comma. By default, all controls are enabled. Usage example: `stepperControls=_undo,_redo`. List of controls: undo, redo, into, expr, out, over, run, interrupt, restart, gotoend, reload |
| **log** | send `platform.validate('log')` at each new program start (default value: false) |
| **viewTestDetails** | always enable the tests/submission panel, even if there is only one test in this task; otherwise this panel is enabled only if there are multiple tests (default value: false) |
| **allowExecutionOverBlocksLimit** | allow bypassing the blocks limit restriction during execution; however in this case the program does not validate and the error is shown post-execution. When `allowExecutionOverBlocksLimit=step_by_step`, the execution is only allowed in step by step mode (options: yes, step_by_step; default value: false) |
| **ioMode** | when not in a task and in the printer layout, choose whether you want `ioMode=split` or `ioMode=terminal` (default value: terminal) |
| **randomizeTestsOrder** | randomize tests before running the program (default value: false) |
| **variant** | set the version of the task, if the task defines multiple versions |
| **workWithGit** | make it possible to sync an editor tab content with a Git file on a repository |

## gridInfos parameters

| Option | Usage |
| :---- | :---- |
| **maxInstructions** | set the maximum number of instructions |
| **startingExample** | set the default source code for each language. Use `{blockly: …, scratch: …, python: …}` |
| **limitedUses** | define limited uses for specific blocks. Example: `limitedUses: [{blocks: ["withdrawNum"], nbUses: 1}, {blocks: ["dropNum"], nbUses: 1}]` |
| **context** | define the library used in this task. Ex: robot, crane… |
| **contextType** | context for the library used in this task. Ex: fishing, sokoban, paint |
| **conceptViewer** | list all available notions for this task. Use `false` to disable it, or an array of notions |
| **conceptViewerBaseUrl** | define the concept viewer base url |
| **unlockedLevels** | specify how many levels are unlocked when opening the task |
| **hiddenTests** | define if the tests should be hidden from the user (default value: false) |
| **forceNextTaskAfter** | specify after which succeeded version index the user should be forced to move to another task. Calls `platform.validate('top')` in this case |
| **defaultLevel** | default level visible when the task is open (options: basic, easy, medium, hard; default value: easy) |
| **expectedStorage** | format of the smart contract storage. Example: `(Pair (string %names) (nat %nb_calls))` |
| **initActionDelay** | delay in ms between two actions at the start of the execution of a program (default value: 255) |
| **tabsEnabled** | enable the multi-tab editor (default value: depends on the type of the task) |
| **documentationOpenByDefault** | force the documentation to be open on the right side when the task opens (default value: false) |
| **remoteDebugEnabled** | enable the remote debug functionality (default value: false) |
| **showViews** | enable or disable the view tabs layout (Exercice, Résoudre) (the default value depends on the library) |
| **hideVariantsInDocumentation** | hide other variants of a block definition, when there are multiple argument lists for the same block (default value: false) |
| **blocksLanguage** | make it possible to use another language for the code blocks only. Example: `blocksLanguage: {python: 'en', blockly: 'fr'}` |
| **maxIter** | number of iterations allowed in the program before stopping the program and displaying "too many iterations" |
| **panelCollapsed** | make the block panel collapsed at the opening of the task (default value: false) |

## codecastParameters parameters

| Option | Usage |
| :---- | :---- |
| **printerLibColumn** | enable the view of the printer lib in 3 columns instead of 3 rows (default value: false) |
| **contextVisualizationDesiredSize** | change the height of the context visualization (default value: 60%) |
| **editorDesiredSize** | change the width of the editor (default value: 60%) |
| **menuPosition** | define where the menu icons are placed (options: right, bottom; default value: right) |
