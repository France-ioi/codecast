
import actions from '../actions';

export const recordEventAction = function (payload) {
  return {
    type: actions.recorderAddEvent,
    timestamp: window.performance.now(),
    payload
  };
};

export const compressRange = function (range) {
  const {start, end} = range;
  if (start.row === end.row && start.column === end.column) {
    return [start.row, start.column];
  } else {
    return [start.row, start.column, end.row, end.column];
  }
};

