
import actions from '../actions';

export const RECORDING_FORMAT_VERSION = '1.0.0';

export const recordEventAction = function (payload) {
  return {
    type: actions.recorderAddEvent,
    timestamp: window.performance.now(),
    payload
  };
};
