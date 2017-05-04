
import * as C from 'persistent-c';

export function* getchar (context) {
  const line = yield ['gets'];
  let result;
  if (line === null) {
    result = -1;
  } else {
    result = line.charCodeAt(0);
    yield ['ungets', line.length - 1];
  }
  yield ['result', new C.IntegralValue(C.builtinTypes['int'], result)];
};
