
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';

import {defineView} from '../utils/linker';

// TODO: add (and export through the linker) a higher-level component using a
// selector to extract the currently displayed terminal instead of relying on
// the buffer being passed as a prop.

export const TermView = EpicComponent(self => {
  self.render = function () {
    const {buffer} = self.props;
    const cursor = buffer.get('cursor');
    const ci = cursor.get('line'), cj = cursor.get('column');
    return (
      <div className="terminal">
        {buffer.get('lines').map(function (line, i) {
          return (
            <div key={i} className="terminal-line">
              {line.map(function (cell, j) {
                if (i == ci && j == cj) {
                  return <span key={j} className="terminal-cursor">{cell.get('char')}</span>;
                }
                return <span key={j}>{cell.get('char')}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };
});

export default function* (deps) {

  yield defineView('TerminalView', TermView);

};
