
// XXX This file is currently not used, and event names are outdated.

import React from 'react';

class EventView extends React.PureComponent {

  render () {
    const {event} = this.props;
    const timestamp = event.get(0);
    let body;
    switch (event.get(1)) {
      case 'start':
        body = <span>start</span>;
        break;
      case 'select':
        body = <span>select {rangeToText(event.get(2))}</span>;
        break;
      case 'insert':
        body = <span>insert {JSON.stringify(event.get(3))} at {rangeToText(event.get(2))}</span>;
        break;
      case 'delete':
        body = <span>delete {rangeToText(event.get(2))}</span>;
        break;
      case 'compile':
        body = <span>begin translation</span>;
        break;
      case 'compileSuccess':
        body = <span>translation succeeded</span>;
        break;
      case 'compileFailure':
        body = <span>translation failed</span>;
        break;
      case 'compileClear':
        body = <span>translation cleared</span>;
        break;
      case 'stepperRestart':
        body = <span>restart stepper</span>;
        break;
      case 'stepExpr':
        body = <span>step expr</span>;
        break;
      case 'stepInto':
        body = <span>step into</span>;
        break;
      case 'stepIdle':
        body = <span>idle after {event.get(2)} steps</span>;
        break;
      case 'stepProgress':
        body = <span>running for {event.get(2)} steps</span>;
        break;
      default:
        body = <span>unknown event {event.get(1)}</span>;
        break;
    }
    return <div className="dev-EventView">{timestamp.toFixed(0)} {body}</div>
  };

});

function rangeToText (range) {
  const start_row = range[0];
  const start_column = range[1];
  const end_row = range[2];
  const end_column = range[3];
  if (end_row === undefined || end_column === undefined)
    return `${start_row},${start_column}`;
  else
    return `${start_row},${start_column}—${end_row},${end_column}`;
}

export default EventView;
