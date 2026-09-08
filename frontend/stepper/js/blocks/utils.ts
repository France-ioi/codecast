import {JavascriptGenerator} from 'blockly/javascript';
import {PythonGenerator} from 'blockly/python';

/**
 * Registers a raw definition (an import, a global variable, …) to be emitted at
 * the top of the generated code.
 *
 * `provideFunction_` only handles function definitions; `definitions_` is the
 * only way to emit anything else, but it is `protected` on `CodeGenerator`.
 */
export function addGeneratorDefinition(generator: JavascriptGenerator|PythonGenerator, name: string, code: string) {
    (generator as unknown as {definitions_: {[key: string]: string}}).definitions_[name] = code;
}
