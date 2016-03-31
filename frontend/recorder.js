
import actions from './actions';

export const recordEventAction = function (payload) {
  return {
    type: actions.recorderAddEvent,
    timestamp: window.performance.now(),
    payload
  };
};
