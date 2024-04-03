// Extracted from "importModules-1.4-mobileFirst.js"

import {Task} from '../task_types';
import {hasBlockPlatform} from '../../stepper/platforms';

let importedModules = {};

function importableModules(modulesPath) {
    // Wait to have modulesPath defined before executing the function
    return {
        'jquery-1.7.1': {src: modulesPath+"/ext/jquery/1.7/jquery.min.js", id: "http://code.jquery.com/jquery-1.7.1.min.js"},
        'jquery-ui-1.10.3': {src: modulesPath+"/ext/jquery-ui/1.10/jquery-ui-1.10.3.custom.min.js", id: "https://code.jquery.com/ui/1.10.3/jquery-ui.min.js"},
        'jquery-ui-1.10.3-styles': {type: "stylesheet", src: modulesPath+"/ext/jquery-ui/1.10/jquery-ui.css", id: "https://code.jquery.com/ui/1.10/jquery-ui.css"},
        'jquery-ui.touch-punch': {src: modulesPath+"/ext/jquery-ui/jquery.ui.touch-punch.min.js", id: "jquery.ui.touch-punch.min.js"},
        'jquery-ui.touch-punch.fixed': {src: modulesPath+"/ext/jquery-ui/jquery.ui.touch-punch.fixed.js", id: "jquery.ui.touch-punch.fixed.js"},
        'jquery.csv': {src: modulesPath+"/ext/jquery-csv/jquery.csv.js", id: "jquery.csv.js"},
        'JSON-js': {src: modulesPath+"/ext/json/json2.min.js", id: "https://github.com/douglascrockford/JSON-js"},
        'raphael-2.2.1': {src: modulesPath+"/ext/raphael/2.2.1/raphael.min.js", id: "http://cdnjs.cloudflare.com/ajax/libs/raphael/2.2.1/raphael.min.js"},
        'beaver-task-2.0': {src: modulesPath+"/pemFioi/beaver-task-2.0.js", id: "http://www.france-ioi.org/modules/pemFioi/beaver-task-2.0.js"},
        'jschannel': {src: modulesPath+"/ext/jschannel/jschannel.js", id: "http://www.france-ioi.org/modules/ext/jschannel/jschannel.js"},
        'raphaelFactory-1.0': {src: modulesPath+"/pemFioi/raphaelFactory-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/raphaelFactory-1.0.js"},
        'delayFactory-1.0': {src: modulesPath+"/pemFioi/delayFactory-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/delayFactory-1.0.js"},
        'simulationFactory-1.0': {src: modulesPath+"/pemFioi/simulationFactory-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/simulationFactory-1.0.js"},
        'platform-pr': {class: "proxy module", src: modulesPath+"/integrationAPI.01/official/platform-pr.js", id: "http://www.france-ioi.org/modules/integrationAPI.01/official/platform-pr.js"},
        'buttonsAndMessages': {class: "stdButtonsAndMessages module", src: modulesPath+"/integrationAPI.01/installationAPI.01/pemFioi/buttonsAndMessages.js",  id: "http://www.france-ioi.org/modules/integrationAPI.01/installationAPI.01/pemFioi/buttonsAndMessages.js"},
        'beav-1.0': {src: modulesPath+"/pemFioi/beav-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/beav-1.0.js"},
        'installationAPI.01': {class: "remove", src: modulesPath+"/integrationAPI.01/installationAPI.01/pemFioi/installation.js"},
        'miniPlatform': {class: "remove", src: modulesPath+"/integrationAPI.01/official/miniPlatform.js"},
        'static-task': {src: modulesPath+"/pemFioi/static-task.js"},
        'acorn': {src: modulesPath+"/ext/js-interpreter/acorn.js", id: "acorn"},
        'acorn-walk': {src: modulesPath+"/ext/acorn/walk.js", id: "acorn-walk"},
        'interpreter': {src: modulesPath+"/ext/js-interpreter/interpreter.js", id: "interpreter"},
        'ace': {src: modulesPath+"/ext/ace/ace.js", id: "ace"},
        'ace_python': {src: modulesPath+"/ext/ace/mode-python.js", id: "ace_python"},
        'ace_json': {src: modulesPath+"/ext/ace/mode-json.js", id: "ace_json"},
        'ace_plain_text': {src: modulesPath+"/ext/ace/mode-plain_text.js", id: "ace_plain_text"},
        'ace_language_tools': {src: modulesPath+"/ext/ace/ext-language_tools.js", id: "ace_language_tools"},
        'processing-1.4.8': {src: modulesPath+"/ext/processing/1.4.8/processing.min.js", id: "https://raw.github.com/processing-js/processing-js/v1.4.8/processing.min.js"},
        'save-svg-as-png': {src: modulesPath+"/ext/save-svg-as-png/saveSvgAsPng.js", id: "save-svg-as-png"},
        'fonts-loader-1.0': {src: modulesPath+"/pemFioi/fontsLoader-1.0.js", id: "fonts-loader"},
        'grid-1.0': {src: modulesPath+"/pemFioi/grid-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/grid-1.0.js"},
        'drag_lib-2.0': {src: modulesPath+"/pemFioi/drag_lib-2.0.js", id: "http://www.france-ioi.org/modules/pemFioi/drag_lib-2.0.js"},
        'simulation-2.0': {src: modulesPath+"/pemFioi/simulation-2.0.js", id: "http://www.france-ioi.org/modules/pemFioi/simulation-2.0.js"},
        'raphaelButton-1.0': {src: modulesPath+"/pemFioi/raphaelButton-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/raphaelButton-1.0.js"},
        'graph-1.0': {src: modulesPath+"/pemFioi/graph-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/graph-1.0.js"},
        'randomGenerator-1.0': {src: modulesPath+"/pemFioi/randomGenerator-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/randomGenerator-1.0.js"},
        'shape-paths': {src: modulesPath+"/pemFioi/shape-paths.js", id: "shape-paths"},
        'zen3d': { src: modulesPath + "/ext/zen3d/zen3d.min.js", id: "zen3d" },
        'zen3d_OrbitControls': { src: modulesPath + "/ext/zen3d/controls/OrbitControls.js", id: "zen3d_OrbitControls" },
        'zen3d_Sprite': { src: modulesPath + "/ext/zen3d/objects/Sprite.js", id: "zen3d_Sprite" },
        'visual-graph-1.1': {src: modulesPath+"/pemFioi/visual-graph-1.1.js", id: "http://www.france-ioi.org/modules/pemFioi/visual-graph-1.1.js"},
        'visual-graph-1.0': {src: modulesPath+"/pemFioi/visual-graph-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/visual-graph-1.0.js"},
        'graph-mouse-1.0': {src: modulesPath+"/pemFioi/graph-mouse-1.0.js", id: "http://www.france-ioi.org/modules/pemFioi/graph-mouse-1.0.js"},
        'graph-mouse-1.1': {src: modulesPath+"/pemFioi/graph-mouse-1.1.js", id: "http://www.france-ioi.org/modules/pemFioi/graph-mouse-1.1.js"},
        'papaparse': {src: modulesPath+"/ext/PapaParse/papaparse.js", id: "papaparse.js"}, // csv parser
        'chartjs': {src: modulesPath+"/ext/chartjs/Chart.min.js", id: "Chart.js"},
        'chartjs_styles': {type: "stylesheet", src: modulesPath+"/ext/chartjs/Chart.min.css", id: "Chart.css"},

        'showdown': {src: modulesPath+"/ext/showdown/showdown.min.js", id: "showdown"},
        'showdownConvert': {src: modulesPath+"/pemFioi/showdownConvert.js", id: "showdownConvert"},
        'mathjax': {src: modulesPath+"/ext/mathjax/MathJax.js?config=TeX-MML-AM_CHTML", id: "mathjax"},
        'post_processor': {src: modulesPath+"/pemFioi/post_processor.js", id: "post_processor"},

        'prismjs': {src: modulesPath+"/ext/prismjs/prism.js", id: "prismjs"},
        'prismjs-css': {type: "stylesheet", src: modulesPath+"/ext/prismjs/prism.css", id: "prismjs-css"},

        'taskStyles-0.1': {type: "stylesheet", src: modulesPath+"/pemFioi/taskStyles-0.1.css", id: "http://www.france-ioi.org/modules/pemFioi/taskStyles-0.1.css"},
        'taskStyles-mobileFirst': {type: "stylesheet", src: modulesPath+"/pemFioi/taskStyles-mobileFirst.css", id: "http://www.france-ioi.org/modules/pemFioi/taskStyles-mobileFirst.css"},

        'conceptDisplay-1.0': {src: modulesPath+"/pemFioi/conceptDisplay-1.0.js", id: "concept_display"},
        'conceptViewer-1.0': {src: modulesPath+"/pemFioi/conceptViewer-1.0-mobileFirst.js", id: "concept_viewer"},
        'conceptViewer_css-1.0': {type: "stylesheet", src: modulesPath+"/pemFioi/conceptViewer-1.0-mobileFirst.css", id: "concept_viewer_css"},
        'conceptViewer-2.0': {src: modulesPath+"/pemFioi/conceptViewer-2.0.js", id: "concept_viewer_2"},
        'conceptViewer_css-2.0': {type: "stylesheet", src: modulesPath+"/pemFioi/conceptViewer-2.0.css", id: "concept_viewer_2_css"},

        'blockly': {src: modulesPath+"/ext/blockly/blockly_compressed.js", id: "blockly"},
        'blockly_blocks': {src: modulesPath+"/ext/blockly/blocks_compressed.js", id: "blockly_blocks"},
        'blockly_javascript': {src: modulesPath+"/ext/blockly/javascript_compressed.js", id: "blockly_javascript"},
        'blockly_python': {src: modulesPath+"/ext/blockly/python_compressed.js", id: "blockly_python"},
        'blockly_fr': {src: modulesPath+"/ext/blockly/fr.js", id: "blockly_fr"},
        'blockly_en': {src: modulesPath+"/ext/blockly/en.js", id: "blockly_en"},
        'blockly_de': {src: modulesPath+"/ext/blockly/de.js", id: "blockly_de"},
        'blockly_es': {src: modulesPath+"/ext/blockly/es.js", id: "blockly_es"},
        'blockly_it': {src: modulesPath+"/ext/blockly/it.js", id: "blockly_it"},
        'blockly_sl': {src: modulesPath+"/ext/blockly/sl.js", id: "blockly_sl"},
        'blockly_fioi': {src: modulesPath+"/ext/blockly-fioi/fioi-blockly.min.js", id: "blockly_fioi"},

        'blockly-robot-0.9': {src: modulesPath+"/pemFioi/blocklyRobot_lib-0.9.1.js", id: "blocklyRobot_lib"},
        'blockly-robot-1.0': {src: modulesPath+"/pemFioi/blocklyRobot_lib-1.0.0.js", id: "blocklyRobot_lib"},
        'blockly-robot-1.1': {src: modulesPath+"/pemFioi/blocklyRobot_lib-1.1.js", id: "blocklyRobot_lib"},
        'blockly-robot-dev': {src: modulesPath+"/pemFioi/blocklyRobot_lib-1.0.1-dev.js", id: "blocklyRobot_lib"},
        'blockly-printer': {src: modulesPath+"/pemFioi/blocklyPrinter_lib.js", id: "blocklyPrinter_lib"},
        'blockly-printer-2.1': {src: modulesPath+"/pemFioi/blocklyPrinter_lib-2.1.js", id: "blocklyPrinter_lib"},
        'blockly-turtle': {src: modulesPath+"/pemFioi/blocklyTurtle_lib.js", id: "blocklyTurtle_lib"},
        'blockly-processing': {src: modulesPath+"/pemFioi/blocklyProcessing_lib.js", id: "blocklyProcessing_lib"},
        'blockly-crane-1.0': {src: modulesPath+"/pemFioi/blocklyCrane_lib-1.0.js", id: "blocklyCrane_lib"},
        'blockly-crane-1.1': {src: modulesPath+"/pemFioi/blocklyCrane_lib-1.1.js", id: "blocklyCrane_lib"},
        'jwinf_css': {type: "stylesheet", src: modulesPath+"/pemFioi/jwinf.css", id: "jwinf_css"}, // for BWINF

        'quickAlgo_utils': {src: modulesPath+"/pemFioi/quickAlgo/utils.js", id: "quickAlgo_utils"},
        'quickAlgo_i18n': {src: modulesPath+"/pemFioi/quickAlgo/i18n.js", id: "quickAlgo_i18n"},
        'quickAlgo_interface': {src: modulesPath+"/pemFioi/quickAlgo/interface-mobileFirst.js", id: "quickAlgo_interface"},
        'quickAlgo_blockly_blocks': {src: modulesPath+"/pemFioi/quickAlgo/blockly_blocks.js", id: "quickAlgo_blockly_blocks"},
        'quickAlgo_blockly_interface': {src: modulesPath+"/pemFioi/quickAlgo/blockly_interface.js", id: "quickAlgo_blockly_interface"},
        'quickAlgo_blockly_runner': {src: modulesPath+"/pemFioi/quickAlgo/blockly_runner.js", id: "quickAlgo_blockly_runner"},
        'quickAlgo_python_interface': {src: modulesPath+"/pemFioi/quickAlgo/python_interface.js", id: "quickAlgo_python_interface"},
        'quickAlgo_python_runner': {src: modulesPath+"/pemFioi/quickAlgo/python_runner.js", id: "quickAlgo_python_runner"},
        'quickAlgo_subtask': {src: modulesPath+"/pemFioi/quickAlgo/subtask.js", id: "quickAlgo_subtask"},
        'quickAlgo_context': {src: modulesPath+"/pemFioi/quickAlgo/context.js", id: "quickAlgo_context"},
        //'quickAlgo_css': {type: "stylesheet", src: modulesPath+"/pemFioi/quickAlgo/quickAlgo.css", id: "quickAlgo_css"},
        'quickAlgo_css': {type: "stylesheet", src: modulesPath+"/pemFioi/quickAlgo/quickAlgo-mobileFirst.css", id: "quickAlgo_css"},

        'createAlgoreaInstructions': {src: modulesPath+"/pemFioi/createAlgoreaInstructions.js", id: "createAlgoreaInstructions"},
        'createAlgoreaInstructions-1.0': {src: modulesPath+"/pemFioi/createAlgoreaInstructions-1.0.js", id: "createAlgoreaInstructions"},
        'algoreaInstructionsStrings': {src: modulesPath+"/pemFioi/algoreaInstructionsStrings.js", id: "algoreaInstructionsStrings"},

        'scratch': {src: modulesPath+"/ext/scratch/blockly_compressed_vertical.js", id: "scratch"},
        'scratch_blocks_common': {src: modulesPath+"/ext/scratch/blocks_compressed.js", id: "scratch_blocks_common"},
        'scratch_blocks': {src: modulesPath+"/ext/scratch/blocks_compressed_vertical.js", id: "scratch_blocks"},
        'scratch_fixes': {src: modulesPath+"/ext/scratch/fixes.js", id: "scratch_fixes"},
        'scratch_procedures': {src: modulesPath+"/ext/scratch/procedures.js", id: "scratch_procedures"},

        'python_count': {src: modulesPath+"/pemFioi/pythonCount-1.0.js", id: "python_count"},
        'skulpt_quickAlgo': {src: modulesPath+"ext/skulpt/skulpt.quickAlgo.min.js", id: "skulpt_quickAlgo"},
        'skulpt_stdlib': {src: modulesPath+"ext/skulpt/skulpt-stdlib.js", id: "skulpt_stdlib"},
        'skulpt_debugger': {src: modulesPath+"ext/skulpt/debugger.js", id: "skulpt_debugger"},

        'codecast7.0_css': {type: "stylesheet", src: modulesPath+"/ext/codecast/7.0/index.css", id: "codecast7.0_css"},
        'codecast7.0_js': {src: modulesPath+"/ext/codecast/7.0/index.js", id: "codecast7.0_js"},
        'codecast7.0_loader': {src: modulesPath+"/ext/codecast/7.0/codecast-loader.js", id: "codecast7.0_loader"},

        'blockly_database': {src: modulesPath+"/pemFioi/database/blockly_database.js", id: "blockly_database"},
        'database': {src: modulesPath+"/pemFioi/database/database.js", id: "database"},
        'database_css': {type: "stylesheet", src: modulesPath+"/pemFioi/database/styles.css", id: "database_css"},

        'files_repository': {src: modulesPath+"/pemFioi/shared/files_repository.js", id: "files_repository"},
        'blocks_helper': {src: modulesPath+"/pemFioi/shared/blocks_helper.js", id: "blocks_helper"},
        'logger': {src: modulesPath+"/pemFioi/shared/logger.js", id: "logger"},
        'numeric_keypad': {src: modulesPath+"/pemFioi/shared/numeric_keypad/keypad.js", id: "numeric_keypad"},
        'numeric_keypad_css': {type: "stylesheet", src: modulesPath+"/pemFioi/shared/numeric_keypad/keypad.css", id: "numeric_keypad_css"},

        // Quiz task
        'quiz_styles': {type: "stylesheet", src: modulesPath+"/pemFioi/quiz/quizStyles-0.1.css", id: "quiz_styles"},
        'quiz': {src: modulesPath+"/pemFioi/quiz/quiz.js", id: "quiz"},
        'quiz_task': {src: modulesPath+"/pemFioi/quiz/task.js", id: "quiz_task"},
        'quiz_grader': {src: modulesPath+"/pemFioi/quiz/grader.js", id: "quiz_grader"},
        'quiz_questions_choice': {src: modulesPath+"/pemFioi/quiz/questions/choice.js", id: "quiz_questions_choice"},
        'quiz_questions_fill_gaps': {src: modulesPath+"/pemFioi/quiz/questions/fill_gaps.js", id: "quiz_questions_fill_gaps"},
        'quiz_questions_input': {src: modulesPath+"/pemFioi/quiz/questions/input.js", id: "quiz_questions_input"},

        // Quiz task v2
        'quiz2_styles': {type: "stylesheet", src: modulesPath+"/pemFioi/quiz2/quizStyles-0.1.css", id: "quiz_styles"},
        'quiz2': {src: modulesPath+"/pemFioi/quiz2/quiz.js", id: "quiz"},
        'quiz2_task': {src: modulesPath+"/pemFioi/quiz2/task.js", id: "quiz_task"},
        'quiz2_grader': {src: modulesPath+"/pemFioi/quiz2/grader.js", id: "quiz_grader"},
        'quiz2_questions_choice': {src: modulesPath+"/pemFioi/quiz2/questions/choice.js", id: "quiz_questions_choice"},
        'quiz2_questions_fill_gaps': {src: modulesPath+"/pemFioi/quiz2/questions/fill_gaps.js", id: "quiz_questions_fill_gaps"},
        'quiz2_questions_input': {src: modulesPath+"/pemFioi/quiz2/questions/input.js", id: "quiz_questions_input"},
        'quiz2_questions_sort_list': {src: modulesPath+"/pemFioi/quiz2/questions/sort_list.js", id: "quiz_questions_sort_list"},
        'quiz2_questions_sort_items': {src: modulesPath+"/pemFioi/quiz2/questions/sort_items.js", id: "quiz_questions_sort_items"},
        'sortable': {src: modulesPath+"/ext/Sortable-master/Sortable.js", id: "sortable"},

        // Video task
        'taskVideo': {src: modulesPath+"/pemFioi/taskVideo/taskVideo.js", id: "taskVideo"},
        'taskVideoPlayer': {src: modulesPath+"/pemFioi/taskVideo/player.js", id: "taskVideoPlayer"},
        'taskVideo_css': {type: "stylesheet", src: modulesPath+"/pemFioi/taskVideo/player.css", id: "taskVideo_css"},

        // Barcode
        'barcode_context': {src: modulesPath+"/pemFioi/barcode/context.js", id: "barcode_context"},
        'barcode_display': {src: modulesPath+"/pemFioi/barcode/display.js", id: "barcode_display"},

        // earth3d and earth textures
        'earth3d': {src: modulesPath+"/pemFioi/components/earth3d/earth3d.js", id: "earth3d"},
        'earth3d_512': {src: modulesPath+"/pemFioi/components/earth3d/textures/512.js", id: "earth3d_512"},
        'earth3d_1024': {src: modulesPath+"/pemFioi/components/earth3d/textures/1024.js", id: "earth3d_1024"},
        'earth3d_2048': {src: modulesPath+"/pemFioi/components/earth3d/textures/2048.js", id: "earth3d_2048"},

        // map2d
        'map2d': {src: modulesPath+"/pemFioi/components/map2d/map2d.js", id: "map2d"},
        'map2d_styles': {type: "stylesheet", src: modulesPath+"/pemFioi/components/map2d/styles.css", id: "map2d_styles"},
        'openstreetmap_task': {src: modulesPath+"/pemFioi/components/map2d/task.js", id: "openstreetmap_task"},

        // gaps table
        'gaps_table': {src: modulesPath+"/pemFioi/components/gaps-table/component.js", id: "gaps_table"},
        'gaps_table_styles': {type: "stylesheet", src: modulesPath+"/pemFioi/components/gaps-table/styles.css", id: "gaps_table_styles"},
        'gaps_table_task': {src: modulesPath+"/pemFioi/components/gaps-table/task.js", id: "gaps_table_task"},

        // csv editor
        'csv_editor': {src: modulesPath+"/pemFioi/components/csv-text-editor/editor.js", id: "csv_editor"},
        'csv_editor_styles': {type: "stylesheet", src: modulesPath+"/pemFioi/components/csv-text-editor/styles.css", id: "csv_editor_styles"},
        'csv_editor_task': {src: modulesPath+"/pemFioi/components/csv-text-editor/task.js", id: "csv_editor_task"},

        // json text editor
        'json-text-editor': {src: modulesPath+"/pemFioi/components/json-text-editor/editor.js", id: "json-text-editor"},
        'json-text-editor-jsonlint': {src: modulesPath+"/pemFioi/components/json-text-editor/jsonlint.js", id: "json-text-editor-jsonlint"},

        // p5
        'p5': {src: modulesPath+"/pemFioi/p5/p5.js", id: "p5"},
        'p5.sound': {src: modulesPath+"/pemFioi/p5/p5.sound.js", id: "p5.sound"},
        'player_p5': {src: modulesPath+"/pemFioi/p5/player_p5.js", id: "player_p5"},
        'blockly_p5': {src: modulesPath+"/pemFioi/p5/blockly_p5.js", id: "blockly_p5"},

        // map
        'geography': {src: modulesPath+"/pemFioi/components/geography/geography.js", id: "geography"},
        'blockly_map': {src: modulesPath+"/pemFioi/map/blockly_map.js", id: "blockly_map"},
        'map': {src: modulesPath+"/pemFioi/map/map.js", id: "map"},
        'blockly_map_v2': {src: modulesPath+"/pemFioi/map_v2/blockly_map.js", id: "blockly_map_v2"},
        'map_v2': {src: modulesPath+"/pemFioi/map_v2/map.js", id: "map_v2"},

        // Bundles
        'bebras-base': {src: modulesPath+"bundles/bebras-base.js", id: "bundle-bebras-base"},
        'bebras-interface': {src: modulesPath+"bundles/bebras-interface.js", id: "bundle-bebras-interface"},
        'js-interpreter': {src: modulesPath+"bundles/js-interpreter.js", id: "bundle-js-interpreter"},
        'blockly-base': {src: modulesPath+"bundles/blockly-base.js", id: "bundle-blockly-base"},
        'scratch-base': {src: modulesPath+"bundles/scratch-base.js", id: "bundle-scratch-base"},
        'quickAlgo-all-blockly': {src: modulesPath+"bundles/quickAlgo-all-blockly.js", id: "bundle-quickAlgo-all-blockly"},
        'quickAlgo-all-python': {src: modulesPath+"bundles/quickAlgo-all-python.js", id: "bundle-quickAlgo-all-python"},

        'blockly-quickpi': { src: modulesPath + "/pemFioi/quickpi/blocklyQuickPi_lib.js", id: "blocklyQuickPi_lib" },
        'quickpi-board': { src: modulesPath + "/pemFioi/quickpi/quickpi_board.js", id: "quickpi_board" },
        'quickpi-connection': { src: modulesPath + "/ext/quickpi/quickpi.js", id: "quickpi_connection" },
        'quickpi-screen': { src: modulesPath + "/pemFioi/quickpi/blocklyQuickPi_screen.js", id: "quickpi-screen" },
        'quickpi-store': { src: modulesPath + "/pemFioi/quickpi/blocklyQuickPi_store.js", id: "quickpi-store" },
        'blockly-distributed': { src: modulesPath + "/pemFioi/quickpi/blocklyQuickPiDistributed_lib.js", id: "blockly-distributed" },

        'traceroute-context': { src: modulesPath + "/pemFioi/network/traceroute/context.js", id: "traceroute-context" },
        'scanip-context': { src: modulesPath + "/pemFioi/network/scanip/context.js", id: "scanip-context" },

        'font-awesome': {type: "stylesheet", src: modulesPath + "/fonts/fontAwesome/css/all.css", id: "font-awesome" },
        'smart_contract_config': {src: modulesPath+"/pemFioi/smartContractConfig.js", id: "smart_contract_config"},
    }
}

function bundledModules() {
    // List of bundles and which modules they include
    // How to import the bundles is defined in importableModules
    return [
        {name: 'bebras-base', included: ['jquery-1.7.1', 'JSON-js', 'raphael-2.2.1', 'beaver-task-2.0', 'jschannel', 'raphaelFactory-1.0', 'delayFactory-1.0', 'simulationFactory-1.0']},
        {name: 'bebras-interface', included: ['platform-pr', 'buttonsAndMessages', 'beav-1.0', 'installationAPI.01', 'miniPlatform']},
        {name: 'js-interpreter', included: ['acorn', 'acorn-walk', 'interpreter']},
        {name: 'blockly-base', included: ['blockly', 'blockly_blocks', 'blockly_javascript', 'blockly_python']},
        {name: 'scratch-base', included: ['scratch', 'scratch_blocks_common', 'scratch_blocks', 'blockly_javascript', 'blockly_python']},
        {name: 'codecast-7.0', included: ['codecast7.0_css', 'codecast7.0_js', 'codecast7.0_loader']}
        // TODO :: bundles with mobileFirst interface
        //      {name: 'quickAlgo-all-blockly', included: ['quickAlgo_utils', 'quickAlgo_i18n', 'quickAlgo_interface', 'quickAlgo_blockly_blocks','quickAlgo_blockly_interface', 'quickAlgo_blockly_runner', 'quickAlgo_subtask', 'quickAlgo_context']},
        //      {name: 'quickAlgo-all-python', included: ['python_count', 'ace', 'ace_python', 'skulpt_quickAlgo', 'skulpt_stdlib', 'skulpt_debugger', 'quickAlgo_utils', 'quickAlgo_i18n', 'quickAlgo_interface', 'quickAlgo_python_interface', 'quickAlgo_python_runner', 'quickAlgo_subtask', 'quickAlgo_context']}
    ];
}

function bundlesToModules(modulesList) {
    // Check modulesList for bundles, replace them with their modules

    let bundledModulesList = bundledModules();

    let bundlesByName = {};
    for(let iBundle in bundledModulesList) {
        let curBundle = bundledModulesList[iBundle];
        bundlesByName[curBundle.name] = curBundle;
    }

    let newList = [];
    let includedModules = {};
    function addModule(module) {
        if(includedModules[module]) { return; }
        newList.push(module);
        includedModules[module] = true;
    }
    for(let iModule in modulesList) {
        let curModule = modulesList[iModule];
        if(bundlesByName[curModule]) {
            for(let iSub in bundlesByName[curModule].included) {
                addModule(bundlesByName[curModule].included[iSub]);
            }
        } else {
            addModule(curModule);
        }
    }
    return newList;
}

async function importModules(modulesList, modulesPath) {
    const importableModulesList = importableModules(modulesPath);

    // If useBundles is True, we'll try to use bundles instead of the
    // corresponding modules. Otherwise, we do the opposite and translate
    // bundles into a list of modules.
    modulesList = bundlesToModules(modulesList);

    const urlParameters = new URLSearchParams(window.location.search);
    const queryParameters = Object.fromEntries(urlParameters);

    for (let iMod in modulesList) {
        let moduleName = modulesList[iMod];
        let curModule = importableModulesList[moduleName];
        if(curModule) {
            // Avoid importing the same module twice
            if(importedModules[moduleName] === true) {
                continue;
            } else {
                importedModules[moduleName] = true;
            }

            let modClass = curModule.class ? curModule.class : 'module';
            let modSrc = curModule.src;
            if(queryParameters['v']) {
                // Add v= parameters to the URLs
                modSrc += (modSrc.indexOf('?') > -1 ? '&' : '?') + 'v=' + queryParameters['v'];
            }
            let modId = curModule.id ? curModule.id : moduleName;
            if(curModule.type == 'stylesheet') {
                getStyle(modSrc, modId, modClass);
            } else {
                await new Promise(resolve => {
                    getScript(modSrc, modId, modClass, resolve);
                });
            }
        } else {
            console.error("Module '"+moduleName+"' unknown.");
        }
    }
}

let jsLibLoaded = null;

export async function importPlatformModules(platform, modulesPath) {
    if (!hasBlockPlatform(platform)) {
        await importModules(['fonts-loader-1.0', 'quickAlgo_utils', 'quickAlgo_i18n'], modulesPath);
        return;
    }

    if (null !== jsLibLoaded) {
        return;
    }
    jsLibLoaded = platform;

    const modulesToImport = {
        blockly: ['fonts-loader-1.0', 'acorn', 'acorn-walk', 'interpreter', 'blockly', 'blockly_blocks', 'blockly_javascript', 'blockly_python', 'blockly_fioi', 'quickAlgo_utils', 'quickAlgo_blockly_blocks', 'quickAlgo_blockly_interface', 'quickAlgo_i18n'],
        scratch: ['fonts-loader-1.0', 'acorn', 'acorn-walk', 'interpreter', 'scratch', 'scratch_blocks_common', 'scratch_blocks',  'blockly_javascript', 'blockly_python', 'blockly_fioi', 'scratch_fixes', 'scratch_procedures', 'quickAlgo_utils', 'quickAlgo_blockly_blocks', 'quickAlgo_blockly_interface', 'quickAlgo_i18n'],
    }

    await importModules(modulesToImport[platform], modulesPath);
}

export function loadFonts(theme: string, task: Task|null) {
    if (window.FontsLoader) {
        const fontsToLoad = ['inconsolata', 'blueprint-16-new'];
        if ('quickpi' === task?.gridInfos?.context) {
            fontsToLoad.push('fontawesome');
        }
        if ('coursera' === theme) {
            fontsToLoad.push('source-sans-pro');
        } else {
            fontsToLoad.push('open-sans');
        }
        window.FontsLoader.loadFonts(fontsToLoad);
    } else {
        console.warn('FontsLoader is not defined, could not load fonts');
    }
}

export function getJsLibLoaded() {
    return jsLibLoaded;
}

function getScript(modSrc, modId, modClass, callback) {
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('id', modId);
    script.setAttribute('class', modClass);
    let head = document.getElementsByTagName('head')[0];

    // @ts-ignore
    script.onload = script.onreadystatechange = function (_, isAbort) {
        // @ts-ignore
        if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState) ) {
            // @ts-ignore
            script.onload = script.onreadystatechange = null;
            script = undefined;

            if(!isAbort && callback) setTimeout(callback, 0);
        }
    };

    script.src = modSrc;
    head.appendChild(script);
}

function getStyle(modSrc, modId, modClass) {
    let script = document.createElement('link');
    script.setAttribute('type', 'text/css');
    script.setAttribute('rel', 'stylesheet');
    script.setAttribute('id', modId);
    script.setAttribute('class', modClass);
    script.href = modSrc;

    let prior = document.getElementsByTagName('script')[0];
    prior.parentNode.insertBefore(script, prior);
}

export {
    importModules,
}
