
import Immutable from 'immutable';
import {take, put, select, call} from 'redux-saga/effects';
import React from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import {use, defineAction, defineSelector, defineView, addReducer, addSaga} from '../utils/linker';
import Document from '../buffers/document';

const examples = [

  {
    title: "demo",
    source: [
      "#include <stdio.h>",
      "int main() {",
      "  int n = 0;",
      "  while (1) {",
      "      n += 1;",
      "      printf(\"ligne %d\\n\", n);",
      "  }",
      "  return 0;",
      "}"
    ].join('\n')
  },

  {
    title: "hello world",
    source: "#include <stdio.h>\nint main() {\n   printf(\"hello, \");\n   printf(\"world! %i\\n\", (2 + 4) * 7);\n}"
  },

  {
    title: "opérateurs unaires",
    source: "#include <stdio.h>\nint main() {\n  int a = 3, *b;\n  printf(\"%i\\n\", +a);\n  printf(\"%i\\n\", -a);\n  printf(\"%i\\n\", !a);\n  printf(\"%i\\n\", ~a);\n  b = &a;\n  printf(\"%i\\n\", *b);\n  printf(\"%lu\\n\", sizeof(a));\n}\n"
  },

  {
    title: "opérateurs binaires",
    source: "#include <stdio.h>\nint main() {\n  printf(\"add %i\\n\", 10 + 2);\n  printf(\"sub %i\\n\", 13 - 1);\n  printf(\"mul %i\\n\", 3 * 4);\n  printf(\"div %i\\n\", 72 / 6);\n  printf(\"rem %i\\n\", 32 % 20);\n  printf(\"and %i\\n\", 15 & 12);\n  printf(\"or  %i\\n\", 4 | 8);\n  printf(\"xor %i\\n\", 6 ^ 10);\n  printf(\"shl %i\\n\", 3 << 2);\n  printf(\"shr %i\\n\", 96 >> 3);\n  printf(\"comma %i\\n\", (4, 12));\n}\n"
  },

  {
    title: "structures de contrôle",
    source: "#include <stdio.h>\nint main() {\n  int k;\n  if (1) {\n    printf(\"t\");\n  }\n  if (0) {\n    printf(\"F\");\n  } else {\n    printf(\"!f\");\n  }\n  for (k = 0; k < 3; k++) {\n    printf(\"%i\", k);\n  }\n  while (k < 5) {\n    printf(\"%i\", k);\n    ++k;\n  }\n  do {\n    printf(\"%i\", k);\n    k += 1;\n  } while (k < 7);\n}\n"
  },

  {
    title: "for, break, continue",
    source: "#include <stdio.h>\nint main() {\n  int i;\n  for (i = 0; i < 5; i++) {\n    printf(\"%i\\n\", i);\n    if (i == 1) { i += 1; continue; }\n    if (i == 3) break;\n  }\n  printf(\"valeur finale: %i\\n\", i);\n}\n"
  },

  {
    title: "opérateurs relationnels",
    source: "#include <stdio.h>\nint main() {\n  int a = 1, b = 2;\n  if (a == a) printf(\" a == a\\n\");\n  if (a != b) printf(\" a != b\\n\");\n  if (a < b) printf(\" a < a\\n\");\n  if (a <= a) printf(\" a <= a\\n\");\n  if (b > a) printf(\" b > a\\n\");\n  if (b >= b) printf(\" b >= b\\n\");\n}\n"
  },

  {
    title: "variables et pointeurs",
    source: "#include <stdio.h>\nint main() {\n  int i = 0, j = 1, *k = &j;\n  *k = 3;\n  printf(\"i = %i, j = %i\\n\", i, j);\n  {\n    int i = 1;\n    j = 2;\n    printf(\"i = %i, j = %i\\n\", i, j);\n  }\n  printf(\"i = %i, j = %i\\n\", i, j);\n}\n"
  },

  {
    title: "et/ou logique et post/pre increment",
    source: "#include <stdio.h>\nint main() {\n  int k = 0;\n  printf(\"%i\", k && k++);\n  printf(\"%i\", k || k++);\n  printf(\"%i\", k || k++);\n  printf(\"%i\", k && k++);\n}\n"
  },

  {
    title: "int, short, char",
    source: "#include <stdio.h>\nint main() {\n  char c = '*', d = 127;\n  unsigned char e = d + 1;\n  int i = c, j = 0x1002A;\n  short  s = j;\n  printf(\"%i %i %i %u\\n\", i, j, s, e);\n}\n"
  },

  {
    title: "tableau 1D",
    source: "#include <stdio.h>\nint main() {\n    //! showArray(a, cursors=[i])\n    int i;\n    int a[8];\n    a[0] = 1;\n    for (i = 1; i < 8; i++) {\n        a[i] = a[i - 1] * 2;\n    }\n    for (i = 0; i < 8; i++) {\n        printf(\"a[%i] = %i\\n\", i, a[i]);\n    }\n}\n"
  },

  {
    title: "appel de fonction",
    source: [
      "#include <stdio.h>",
      "int fact(int n) {",
      "    if (n == 0)",
      "        return 1;",
      "    return n * fact(n - 1);",
      "}",
      "int main() {",
      "    int n = 12;",
      "    printf(\"%d! = %d\\n\", n, fact(n));",
      "}"
    ].join('\n')
  },

  {
    title: "entrée/sortie",
    source: [
      "#include <stdio.h>",
      "unsigned long strlen(const char * s) {",
      "  unsigned long l = 0;",
      "  while (*s++) ++l;",
      "  return l;",
      "}",
      "int main() {",
      "    int a, n;",
      "    char s[12];",
      "    printf(\"Entrez un mot et un nombre:\\n\");",
      "    n = scanf(\"%s %d\", s, &a);",
      "    if (n == 2) {",
      "        printf(\"Longueur du mot * nombre = %lu\\n\", strlen(s) * a);",
      "    } else {",
      "        printf(\"Pas de valeur!\\n\");",
      "    }",
      "    return 0;",
      "}"
    ].join('\n')
  },

  {
    title: "factorielle",
    source: "#include <stdio.h>\nint main (int argc, char** argv) {\n    //! showVar(b)\n    int b = 1;\n    for (int a = 1; a < 1000000; a += 1) {\n        b = b * a;\n        printf(\"%d\\n\", b);\n    }\n    return 1;\n}\n",
    selection: {start: {row: 2, column: 24}, end: {row: 2, column: 31}}
  },

  {
    title: "fibonacci",
    source: [
      "#include <stdio.h>",
      "int fibo(int n) {",
      "   if (n == 0)",
      "       return 0;",
      "   if (n == 1)",
      "       return 1;",
      "   int a = fibo(n - 1);",
      "   int b = fibo(n - 2);",
      "   return a + b;",
      "}",
      "int main() {",
      "     int n = 15;",
      "     printf(\"fibo(%d) = %d\\n\", n, fibo(n));",
      "}"
    ].join('\n')
  },

  {
    title: "listes d'initialisation",
    source: [
      "// Cet exemple n'est pas encore géré par l'évaluateur pas-à-pas",
      "#include <stdio.h>",
      "int main() {",
      "    int a[] = {1, 2};",
      "    int * b = a;",
      "    return 0;",
      "}"
    ].join('\n')
  },

  {
    title: "types composés",
    source: [
      "#include <stdio.h>",
      "int main() {",
      "",
      "    // array of pointer to int",
      "    int *a[1];",
      "    int a_value = 1;",
      "    a[0] = &a_value;",
      "",
      "    // declare b as pointer to array of int",
      "    int (*b)[];",
      "    int b_value[1];",
      "    b = &b_value;",
      "",
      "    // declare foo as array 3 of array 2 of pointer to pointer to function returning pointer to array of pointer to char",
      "    char *(*(**foo[3][2])())[];",
      "",
      "    return 0;",
      "}"
    ].join('\n')
  }

  // TODO: add example for a?b:c

];

const startOfBuffer = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};

export default function* (deps) {

  yield use('sourceReset', 'inputReset');

  yield defineAction('exampleSelected', 'Example.Selected');

  yield addReducer('init', state => state.set('examples', examples));

  yield defineSelector('getExamples', function (state) {
    return state.getIn(['examples']);
  });

  function* loadExample (example) {
    const sourceModel = Immutable.Map({
      document: Document.fromString(example.source),
      selection: example.selection || startOfBuffer,
      firstVisibleRow: example.firstVisibleRow || 0
    });
    yield put({type: deps.sourceReset, model: sourceModel});
    const inputModel = Immutable.Map({
      document: Document.fromString(example.input || ""),
      selection: startOfBuffer,
      firstVisibleRow: 0
    });
    yield put({type: deps.inputReset, model: inputModel});
  }

  yield addSaga(function* watchExampleSelected () {
    while (true) {
      let {example} = yield take(deps.exampleSelected);
      if (typeof example === 'number') {
        let examples = yield select(deps.getExamples);
        example = examples[example];
      }
      yield call(loadExample, example);
    }
  });

  yield defineSelector('ExamplePickerSelector', function (state, props) {
    const examples = deps.getExamples(state);
    return {examples};
  });

  yield defineView('ExamplePicker', 'ExamplePickerSelector', EpicComponent(self => {

    const onSelectExample = function (event, i) {
      const example = self.props.examples[i];
      self.props.dispatch({type: deps.exampleSelected, example});
    };

    self.render = function () {
      const {examples, disabled} = self.props;
      return (
        <Nav bsStyle="pills" className="nav-examples" title="exemples">
          <NavDropdown title={<i className="fa fa-cubes"/>} disabled={disabled} pullRight={true}>
            {examples.map((example, i) => <MenuItem key={i} eventKey={i} onSelect={onSelectExample}>{example.title}</MenuItem>)}
          </NavDropdown>
        </Nav>
      );
    };

  }));

};
