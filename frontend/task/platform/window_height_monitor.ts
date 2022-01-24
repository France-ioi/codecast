import {call, delay} from 'typed-redux-saga';

let lastHeight;

export const getHeight = () => {
  return Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
};

export function* windowHeightMonitorSaga (platformApi) {
  while (true) {
    yield* delay(500);
    const height = getHeight();
    if (height !== lastHeight) {
      yield* call(platformApi.updateDisplay, {height});
      lastHeight = height;
    }
  }
}
