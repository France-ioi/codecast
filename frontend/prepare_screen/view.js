
import React from 'react';
import {connect} from 'react-redux';
import AceEditor from 'react-ace';
import {Button, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import EpicComponent from 'epic-component';
import Immutable from 'immutable';
import * as ace from 'brace';
const Range = ace.acequire('ace/range').Range;

import Editor from '../common/editor';
import Document from '../common/document';
import actions from '../actions';

const examples = [
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
    source: "int fact(int n) {\n  if (n == 0)\n    return 1;\n  return n * fact(n - 1);\n}\nint main() {\n  printf(\"8! = %d\", fact(8));\n}\n"
  }
  // TODO: test these expressions: a?b:c; a[b]; (int)a; c[0];
];


export const PrepareScreen = EpicComponent(self => {

  let editor;

  const onSourceInit = function (editor_) {
    editor = editor_;
    if (editor) {
      const {source} = self.props;
      const value = Document.toString(source.get('document'));
      const selection = source.get('selection');
      editor.reset(value, selection);
    }
  };

  const onSelectExample = function (event, i) {
    const text = examples[i].source;
    const selection = {start: {row: 0, column: 0}, end: {row: 0, column: 0}};
    editor.reset(text, selection);
  };

  const onSourceEdit = function (delta) {
    self.props.dispatch({type: actions.prepareScreenSourceEdit, delta});
  };

  const onSourceSelect = function (selection) {
    self.props.dispatch({type: actions.prepareScreenSourceSelect, selection});
  };

  const onStartRecording = function () {
    self.props.dispatch({type: actions.recorderStart});
  };

  self.render = function () {
    return (
      <div>
        <div className="row">
          <div className="col-md-12">
            <div className="pane pane-controls">
              <p>
                <Button onClick={onStartRecording} className="float-left">
                  <i className="fa fa-circle" style={{color: '#a01'}}/>
                </Button>
                {" démarrer l'enregistrement"}
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12">
            <div className="pane pane-source">
              <h2>Source C initial</h2>
              <Nav bsStyle="pills" className="pull-right">
                <NavDropdown title="Exemples" id="nav-examples">
                  {examples.map((example, i) => <MenuItem key={i} eventKey={i} onSelect={onSelectExample}>{example.title}</MenuItem>)}
                </NavDropdown>
              </Nav>
              <p>
                Cet éditeur contient le code source avec lequel démarre
                l'enregistrement.  La position du curseur et la sélection
                sont aussi conservées.
              </p>
              <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect} width='100%' height='336px'/>
            </div>
          </div>
        </div>
      </div>
    );
  };

});

function selector (state, props) {
  const source = state.get('prepare').get('source');
  return {source};
};

export default connect(selector)(PrepareScreen);
