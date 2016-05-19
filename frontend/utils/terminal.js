
import React from 'react';
import EpicComponent from 'epic-component';
import classnames from 'classnames';

export default EpicComponent(self => {
  self.render = function () {
    const {terminal} = self.props;
    if (!terminal) {
      return (
        <div className="terminal">
          <div className="terminal-placeholder">
            {"Programme arrêté, pas de sortie à afficher."}
          </div>
        </div>
      );
    }
    return (
      <div className="terminal">
        {terminal.lines.map(function (line, i) {
          return (
            <div key={i} className="terminal-line">
              {line.map(function (cell, j) {
                return <span key={j}>{cell.char}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };
});
