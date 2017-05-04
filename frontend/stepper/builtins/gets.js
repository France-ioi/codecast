
import * as C from 'persistent-c';

export function* gets (context, ref) {
  const line = yield ['gets'];
  let result = C.nullPointer;
  if (line !== null) {
    const value = new C.stringValue(line);
    yield ['store', ref, value];
    result = ref;
  }
  yield ['result', result];
};
