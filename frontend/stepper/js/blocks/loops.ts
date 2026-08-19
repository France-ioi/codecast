import * as Blockly from 'blockly/core';
import {javascriptGenerator, Order as JavascriptOrder} from 'blockly/javascript';
import {pythonGenerator, Order as PythonOrder} from 'blockly/python';

let reportLoopIterations = true;

/**
 * Whether the generated JavaScript reports the iteration number of each `repeat`
 * loop, to display it above the block in step-by-step mode. Turned off while
 * generating code that is meant to be read rather than run.
 */
export function setReportLoopIterations(newReportLoopIterations: boolean) {
    reportLoopIterations = newReportLoopIterations;
}

export function addLoopBlocks() {
    // Overrides the standard generator to name the loop variable 'loop' rather
    // than 'count', and to report the current iteration.
    javascriptGenerator.forBlock['controls_repeat_ext'] = function(block) {
        // Repeat n times.
        let repeats: string;
        if (block.getField('TIMES')) {
            // Internal number.
            repeats = String(Number(block.getFieldValue('TIMES')));
        } else {
            // External number.
            repeats = javascriptGenerator.valueToCode(block, 'TIMES',
                JavascriptOrder.ASSIGNMENT) || '0';
        }

        let branch = javascriptGenerator.statementToCode(block, 'DO');
        branch = javascriptGenerator.addLoopTrap(branch, block);

        let code = '';
        const loopVar = javascriptGenerator.nameDB_.getDistinctName(
            'loop', Blockly.Names.NameType.VARIABLE);

        let endVar = repeats;
        if (!repeats.match(/^\w+$/) && !Blockly.utils.string.isNumber(repeats)) {
            endVar = javascriptGenerator.nameDB_.getDistinctName(
                'repeat_end', Blockly.Names.NameType.VARIABLE);
            code += `var ${endVar} = ${repeats};\n`;
        }

        // Displayed above the block, as the loop runs, by BlocklyRunner.
        const reportIteration = reportLoopIterations
            ? `reportBlockValue('${block.id}', ${loopVar} + 1, '@@LOOP_ITERATION@@');\n`
            : '';

        code += `for (var ${loopVar} = 0; ${loopVar} < ${endVar}; ${loopVar}++) {\n`
            + reportIteration + branch + '}\n';

        return code;
    }

    javascriptGenerator.forBlock['controls_repeat'] = javascriptGenerator.forBlock['controls_repeat_ext'];

    // Overrides the standard generator to name the loop variable 'loop' rather
    // than 'count'.
    pythonGenerator.forBlock['controls_repeat_ext'] = function(block) {
        // Repeat n times.
        let repeats: string;
        if (block.getField('TIMES')) {
            // Internal number.
            repeats = String(parseInt(block.getFieldValue('TIMES'), 10));
        } else {
            // External number.
            repeats = pythonGenerator.valueToCode(block, 'TIMES',
                PythonOrder.NONE) || '0';
        }
        const range = Blockly.utils.string.isNumber(repeats)
            ? String(parseInt(repeats, 10))
            : `int(${repeats})`;

        let branch = pythonGenerator.statementToCode(block, 'DO');
        branch = pythonGenerator.addLoopTrap(branch, block) || pythonGenerator.PASS;

        const loopVar = pythonGenerator.nameDB_.getDistinctName(
            'loop', Blockly.Names.NameType.VARIABLE);

        return `for ${loopVar} in range(${range}):\n${branch}`;
    }

    pythonGenerator.forBlock['controls_repeat'] = pythonGenerator.forBlock['controls_repeat_ext'];
}
