
import Immutable from 'immutable';

import Document from '../../common/document';

const startOfBuffer = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};

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
    source: "int main() {\n   printf(\"hello, \");\n   printf(\"world! %i\\n\", (2 + 4) * 7);\n}"
  },
  {
    title: "opérateurs unaires",
    source: "int main() {\n  int a = 3, *b;\n  printf(\"%i\\n\", +a);\n  printf(\"%i\\n\", -a);\n  printf(\"%i\\n\", !a);\n  printf(\"%i\\n\", ~a);\n  b = &a;\n  printf(\"%i\\n\", *b);\n  printf(\"%i\\n\", sizeof(a));\n}\n"
  },
  {
    title: "opérateurs binaires",
    source: "int main() {\n  printf(\"add %i\\n\", 10 + 2);\n  printf(\"sub %i\\n\", 13 - 1);\n  printf(\"mul %i\\n\", 3 * 4);\n  printf(\"div %i\\n\", 72 / 6);\n  printf(\"rem %i\\n\", 32 % 20);\n  printf(\"and %i\\n\", 15 & 12);\n  printf(\"or  %i\\n\", 4 | 8);\n  printf(\"xor %i\\n\", 6 ^ 10);\n  printf(\"shl %i\\n\", 3 << 2);\n  printf(\"shr %i\\n\", 96 >> 3);\n  printf(\"comma %i\\n\", (4, 12));\n}\n"
  },
  {
    title: "structures de contrôle",
    source: "int main() {\n  int k;\n  if (1) {\n    printf(\"t\");\n  }\n  if (0) {\n    printf(\"F\");\n  } else {\n    printf(\"!f\");\n  }\n  for (k = 0; k < 3; k++) {\n    printf(\"%i\", k);\n  }\n  while (k < 5) {\n    printf(\"%i\", k);\n    ++k;\n  }\n  do {\n    printf(\"%i\", k);\n    k += 1;\n  } while (k < 7);\n}\n"
  },
  {
    title: "for, break, continue",
    source: "int main() {\n  int i;\n  for (i = 0; i < 5; i++) {\n    printf(\"%i\\n\", i);\n    if (i == 1) { i += 1; continue; }\n    if (i == 3) break;\n  }\n  printf(\"valeur finale: %i\\n\", i);\n}\n"
  },
  {
    title: "opérateurs relationnels",
    source: "int main() {\n  int a = 1, b = 2;\n  if (a == a) printf(\" a == a\\n\");\n  if (a != b) printf(\" a != b\\n\");\n  if (a < b) printf(\" a < a\\n\");\n  if (a <= a) printf(\" a <= a\\n\");\n  if (b > a) printf(\" b > a\\n\");\n  if (b >= b) printf(\" b >= b\\n\");\n}\n"
  },
  {
    title: "variables et pointeurs",
    source: "int main() {\n  int i = 0, j = 1, *k = &j;\n  *k = 3;\n  printf(\"i = %i, j = %i\\n\", i, j);\n  {\n    int i = 1;\n    j = 2;\n    printf(\"i = %i, j = %i\\n\", i, j);\n  }\n  printf(\"i = %i, j = %i\\n\", i, j);\n}\n"
  },
  {
    title: "et/ou logique et post/pre increment",
    source: "int main() {\n  int k = 0;\n  printf(\"%i\", k && k++);\n  printf(\"%i\", k || k++);\n  printf(\"%i\", k || k++);\n  printf(\"%i\", k && k++);\n}\n"
  },
  {
    title: "int, short, char",
    source: "int main() {\n  char c = '*', d = 127;\n  unsigned char e = d + 1;\n  int i = c, j = 0x1002A;\n  short  s = j;\n  printf(\"%i %i %i %u\\n\", i, j, s, e);\n}\n"
  },
  {
    title: "tableau 1D",
    source: "int main() {\n    //! showArray(a, cursors=[i])\n    int i;\n    int a[8];\n    a[0] = 1;\n    for (i = 1; i < 8; i++) {\n        a[i] = a[i - 1] * 2;\n    }\n    for (i = 0; i < 8; i++) {\n        printf(\"a[%i] = %i\\n\", i, a[i]);\n    }\n}\n"
  },
  {
    title: "appel de fonction",
    source: [
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
    source: "int main (int argc, char** argv) {\n    //! showVar(b)\n    int b = 1;\n    for (int a = 1; a < 1000000; a += 1) {\n        b = b * a;\n        printf(\"%d\\n\", b);\n    }\n    return 1;\n}\n",
    selection: {start: {row: 2, column: 24}, end: {row: 2, column: 31}}
  },
  {
    title: "listes d'initialisation",
    source: [
      "#include <stdio.h>",
      "int main() {",
      "    int a[] = {1, 2};",
      "    int * b = a;",
      "    return 0;",
      "}"
    ].join('\n')
  },
  {
    title: "fibonacci",
    source: [
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
  }
  // TODO: test these expressions: a?b:c; a[b]; (int)a; c[0];
];

export function prepareScreenInit (state, action) {
  const initialDocument = Document.fromString(examples[0].source);
  const initialSource = Immutable.Map({document: initialDocument, selection: startOfBuffer});
  const initialInput = Immutable.Map({document: Document.fromString(""), selection: startOfBuffer});
  return state.set('prepare', Immutable.Map({
    source: initialSource,
    input: initialInput,
    examples
  }));
};

export function prepareScreenSourceInit (state, action) {
  return state.setIn(['prepare', 'source', 'editor'], action.editor);
};

export function prepareScreenSourceEdit (state, action) {
  const prevSource = state.getIn(['prepare', 'source', 'document']);
  const source = Document.applyDelta(prevSource, action.delta);
  return state.setIn(['prepare', 'source', 'document'], source);
};

export function prepareScreenSourceSelect (state, action) {
  return state.setIn(['prepare', 'source', 'selection'], action.selection);
};

// No reducer for prepareScreenExampleSelected, the saga watchExampleSelected
// calls editor.reset which triggers edit/select events that will update the
// state.
