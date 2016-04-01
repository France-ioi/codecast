
import React from 'react';
import EpicComponent from 'epic-component';

export const EventView = EpicComponent(self => {

  const renderRange = function (range) {
    const {start, end} = range;
    if (start.row === end.row && start.column === end.column)
      return `${start.row},${start.column}`;
    else
      return `${start.row},${start.column}—${end.row},${end.column}`;
  };

  self.render = function () {
    const {event} = self.props;
    const timestamp = event.get(0);
    let body;
    switch (event.get(1)) {
      case 'select':
        body = <span>select {renderRange(event.get(2))}</span>;
        break;
      case 'insert':
        body = <span>insert {JSON.stringify(event.get(3))} at {renderRange(event.get(2))}</span>;
        break;
      case 'delete':
        body = <span>delete {renderRange(event.get(2))}</span>;
        break;
      case 'translate':
        body = <span>begin translation</span>;
        break;
      case 'translateSuccess':
        body = <span>translation succeeded</span>;
        break;
      case 'translateFailure':
        body = <span>translation failed</span>;
        break;
      case 'translateClear':
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

export default EventView;
