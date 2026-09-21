# Codecast parameters

There are several ways to customize Codecast parameters.

## URL parameters

We add them to the URL, e.g.: `&platform=unix&theme=coursera&noDoc`.

If you find `amp;` in the URL, this is a copy-pasting error from an `&`. You should erase `amp;`.

Boolean options are enabled by their mere presence in the URL (e.g. `&noDoc`), whatever their value.

These URL parameters are ignored if the page sets the `disableQueryOptions` option.

### Interface

| Option | Usage |
| :---- | :---- |
| **noDoc** | hide the documentation from the interface (default value: false) |
| **theme** | apply a different theme (default value: france-ioi theme; other value: coursera) |
| **noFullScreen** | hide the full screen button from the interface (default value: false) |
| **directives** | show the directive blocks in the available blocks menu (default value: false) |
| **record** | show the record button in the menu on the right (default value: false) |
| **sLocale** | set the preferred interface language (options: fr, en, nl, de) |
| **language** | set the preferred interface language (options: fr-FR, en-US, nl-BE, de-DE) |
| **noLanguageChange** | hide the language change option in the settings |
| **noStepper** | hide the stepper, stack, views and input/output from the interface (default value: false, *legacy behaviour*) |
| **noStack** | hide the variables stack from the interface (default value: false) |
| **noMenu** | hide the menu on the right (with settings, recorder, etc.) |
| **noSettings** | hide the settings in the menu on the right |
| **noViews** | hide all the user-defined visualizations from the interface (default value: false) |
| **noIO** | hide the terminal or input/output from the interface (default value: false) |
| **stepperControls** | make it possible to hide specific stepper controls. Use `_` before a control to hide it, and use `-` to show it disabled. Separate controls by a comma. By default, all controls are enabled. Usage example: `stepperControls=_speed,-gotoend`. List of controls: compile, run, interrupt, into, over, out, expr, restart, gotoend, speed, and reload (the reload button in the menu) |
| **ioMode** | when not in a task and in the printer layout, choose whether you want `ioMode=split` or `ioMode=terminal` (default value: terminal) |
| **viewTestDetails** | always enable the tests/submission panel, even if there is only one test in this task; otherwise this panel is enabled only if there are multiple tests (default value: false) |
| **codeHelp** | enable the CodeHelp AI assistant in the hints. Only works if the CodeHelp configuration (`codeHelp.url`, etc.) is defined in the Codecast options |

### Language and source

| Option | Usage |
| :---- | :---- |
| **platform** | set the programming language and hide the language change option in the settings (options: python, c, cpp, java, blockly, scratch, pascal, ocaml; `unix` is still accepted as an alias of cpp). Without this parameter, the last language chosen by the user is used |
| **source** | set the initial source code |

### Task

| Option | Usage |
| :---- | :---- |
| **task** | load one of the predefined tasks bundled with Codecast, by its id (example: robot) |
| **taskId** | load a task from the task server, by its id |
| **sPlatform** | with `taskId`, name of the platform the task is loaded from |
| **sToken** | with `taskId`, task token given by the platform |
| **level** | set the enabled levels, separated by a comma to enable multiple levels (options: basic, easy, medium, hard) |
| **defaultLevel** | set the level which will be loaded by default, if existing (options: basic, easy, medium, hard). Takes priority over the `defaultLevel` of the task |
| **variant** | set the version of the task, if the task defines multiple versions |
| **log** | send `platform.validate('log')` at each new program start (default value: false) |
| **allowExecutionOverBlocksLimit** | allow bypassing the blocks limit restriction during execution; however in this case the program does not validate and the error is shown post-execution. When `allowExecutionOverBlocksLimit=step_by_step`, the execution is only allowed in step by step mode (options: yes, step_by_step; default value: false) |
| **randomizeTestsOrder** | randomize tests before running the program (default value: false) |
| **workWithGit** | make it possible to sync an editor tab content with a Git file on a repository |
| **iframe** | use `iframe=noApi` to prevent Codecast from considering it is embedded in a platform when it cannot access its parent window |

### Recordings

| Option | Usage |
| :---- | :---- |
| **recording** | URL of the recording to load (without extension; the audio is loaded from the same URL with `.mp3`) |
| **mode** | set the mode of the recording, use `edit` to use the editor (options: edit, view; default value: view) |
| **noDownload** | disable the possibility of downloading the recording (default value: false) |

## gridInfos parameters

These parameters are defined in the task, in `subTask.gridInfos`.

Any parameter can be made level-specific, either by giving a value for each level (e.g. `maxInstructions: {easy: 20, medium: 30, hard: 40}`), or with a `shared` value merged with level-specific values (e.g. `{shared: [...], easy: [...]}`).

### Library

| Option | Usage |
| :---- | :---- |
| **context** | define the library used in this task. Ex: robot, crane, printer, quickpi... |
| **contextType** | context for the library used in this task. Ex: fishing, sokoban, paint |
| **importModules** | list of additional bebras modules to import for this task |
| **images** | list of images to preload for this task (`[{id: ..., path: ...}]`) |
| **libOptions** | options specific to the library (e.g. used by the printer library) |
| **multithread** | enable the multi-threaded execution of the program, for libraries that support it (e.g. quickpi) (default value: false) |

### Program and blocks

| Option | Usage |
| :---- | :---- |
| **includeBlocks** | define the blocks available in this task: `generatedBlocks`, `standardBlocks` (`includeAll`, `wholeCategories`, `singleBlocks`), `variables`, `procedures`, `groupByCategory`, `pythonAdditionalFunctions`, `pythonForceAllowed`, `pythonForceForbidden` |
| **maxInstructions** | set the maximum number of instructions |
| **startingExample** | set the default source code for each language. Use `{blockly: ..., scratch: ..., python: ...}` |
| **limitedUses** | define limited uses for specific blocks. Example: `limitedUses: [{blocks: ["withdrawNum"], nbUses: 1}, {blocks: ["dropNum"], nbUses: 1}]` |
| **blocksLanguage** | make it possible to use another language for the code blocks only. Example: `blocksLanguage: {python: 'en', blockly: 'fr'}` |
| **maxIter** | number of iterations allowed in the program before stopping the program and displaying "too many iterations" (default value: 400000 for Blockly/Scratch, 4000 for Python) |
| **maxIterWithoutAction** | Blockly/Scratch only: number of iterations allowed without any library action before stopping the program (default value: 500) |
| **maxListSize** | Blockly/Scratch only: maximum size of the lists |
| **placeholderBlocks** | Blockly/Scratch only: add placeholder blocks inside the standard blocks inputs |
| **showIfMutator** | Blockly/Scratch only: show the mutator on the "if" block, to add "else if" / "else" branches |
| **zoom** | Blockly/Scratch only: configure the workspace zoom (`{wheel: boolean, controls: boolean, scale: number}`) |
| **scrollbars** | Blockly/Scratch only: show the workspace scrollbars |
| **blocklyColourTheme** | Blockly/Scratch only: colour theme of the blocks (e.g. bwinf) |
| **panelCollapsed** | make the block panel collapsed at the opening of the task (default value: false) |
| **tabsEnabled** | enable the multi-tab editor (default value: false) |
| **expectedStorage** | format of the smart contract storage. Example: `(Pair (string %names) (nat %nb_calls))` |

### Execution and grading

| Option | Usage |
| :---- | :---- |
| **actionDelay** | delay in ms between two library actions; it is then changed by the speed control (default value: 255) |
| **initActionDelay** | delay in ms between two actions at the start of the execution of a program (default value: 255) |
| **checkEndCondition** | function `(context, lastTurn)` checking whether the task is solved, throwing a message to end the execution |
| **checkEndEveryTurn** | call `checkEndCondition` after each action, and not only at the end of the program (default value: false) |
| **computeGrade** | function `(context, message)` computing the grade, returning `{successRate, message}` |
| **hiddenTests** | define if the tests should be hidden from the user (default value: false) |
| **allowClientExecution** | for server tasks, allow executing the program in the browser for languages that support it (default value: false, true for tasks with client-side data) |
| **remoteDebugEnabled** | enable the remote debug functionality (default value: false) |

### Levels and navigation

| Option | Usage |
| :---- | :---- |
| **defaultLevel** | default level visible when the task is open (options: basic, easy, medium, hard; default value: the first defined level) |
| **unlockedLevels** | specify how many levels are unlocked when opening the task |
| **forceNextTaskAfter** | specify after which succeeded version index the user should be forced to move to another task. Calls `platform.validate('top')` in this case |

### Instructions, documentation and help

| Option | Usage |
| :---- | :---- |
| **intro** | instructions of the task, when using the Algorea instructions generator |
| **hints** | list of hints available for this task |
| **codeHelpAdditionalContext** | additional context given to the CodeHelp AI assistant |
| **conceptViewer** | list all available notions for this task. Use `false` to disable it, or an array of notions |
| **conceptViewerBaseUrl** | define the concept viewer base url |
| **documentationOpenByDefault** | force the documentation to be open on the right side when the task opens (default value: false) |
| **hideVariantsInDocumentation** | hide other variants of a block definition, when there are multiple argument lists for the same block (default value: false) |
| **showViews** | enable or disable the view tabs layout (Exercice, Résoudre) (the default value depends on the library) |

### Logging

| Option | Usage |
| :---- | :---- |
| **logOption** | send the attempts logs to the platform, like the `log` URL parameter (default value: false) |
| **usedSkills** | list of skills used in this task, sent in the logs |
| **targetNbInstructions** | target number of instructions for this task, sent in the logs |

## codecastParameters parameters

These parameters are defined in the task (`codecastParameters`, for tasks loaded from the task server) and override the Codecast options. Any Codecast option can be set this way, here are the most useful ones.

| Option | Usage |
| :---- | :---- |
| **printerLibColumn** | display the input and output of the printer lib side by side in columns instead of rows (default value: false) |
| **contextVisualizationDesiredSize** | change the height of the context visualization (default value: 60%) |
| **editorDesiredSize** | change the width of the editor (default value: 60%) |
| **menuPosition** | define where the menu icons are placed (options: right, bottom; default value: right) |
| **canAddUserTests** | allow the user to create their own tests, if the library supports it (default value: false) |
| **taskSuccessStayOnCurrentVersionDisabled** | hide the button to stay on the current version in the task success dialog (default value: false) |
