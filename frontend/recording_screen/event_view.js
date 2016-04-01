
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
        body = <div>select {renderRange(event.get(2))}</div>;
        break;
      case 'insert':
        body = <div>insert {JSON.stringify(event.get(3))} at {renderRange(event.get(2))}</div>;
        break;
      case 'delete':
        body = <div>delete {renderRange(event.get(2))}</div>;
        break;
      case 'translate':
        body = <div>begin translation</div>;
        break;
      case 'translateSuccess':
        body = <div>translation succeeded</div>;
        break;
      case 'translateFailure':
        body = <div>translation failed</div>;
        break;
      case 'translateClear':
        body = <div>translation cleared</div>;
        break;
      case 'stepperRestart':
        body = <div>restart stepper</div>;
        break;
      case 'stepExpr':
        body = <div>step expr</div>;
        break;
      case 'stepInto':
        body = <div>step into</div>;
        break;
      case 'stepIdle':
        body = <div>idle after {event.get(2)} steps</div>;
        break;
      default:
        body = <div>unknown event {event.get(1)}</div>;
        break;
    }
    return <div className="dev-EventView">{body}</div>
  };

});

export default EventView;
