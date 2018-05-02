
import React from 'react';
import {Button} from '@blueprintjs/core';

export default function (bundle, deps) {

  bundle.defineView('TrimEditor', TrimEditorSelector, TrimEditor);

};

function TrimEditorSelector (state, props) {
  return {};
}

class TrimEditor extends React.PureComponent {
  render () {
    return <p>{"Trim"}</p>;
  }
}
