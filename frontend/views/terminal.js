
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';

import {defineView} from '../utils/linker';

// TODO: add (and export through the linker) a higher-level component using a
// selector to extract the currently displayed terminal instead of relying on
// the buffer being passed as a prop.

export const TermView = EpicComponent(self => {

  let terminalElement;

  function refTerminal (element) {
    terminalElement = element;
  }

  function onKeyDown (event) {
    event.stopPropagation();
    terminalElement.focus();
    let block = false;
    switch (event.keyCode) {
    case 8:
      block = true;
      self.props.onBackspace();
      break;
    case 13:
      block = true;
      self.props.onEnter();
      break;
    }
    if (block) {
      event.preventDefault();
    }
  }

  function onKeyUp (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  function onKeyPress (event) {
    event.stopPropagation();
    event.preventDefault();
    // console.log('press', event.key, event.keyCode);
    self.props.onKeyPress(event.key);
  }

  self.render = function () {
    const {buffer} = self.props;
    const cursor = buffer.get('cursor');
    const ci = cursor.get('line'), cj = cursor.get('column');
    return (
      <div ref={refTerminal} className="terminal" tabIndex="1" onKeyDown={onKeyDown} onKeyUp={onKeyUp} onKeyPress={onKeyPress}>
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
