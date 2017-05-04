
import * as C from 'persistent-c';

export function* puts (context, strRef) {
  const str = C.readString(context.state.memory, strRef) + '\n';
  yield ['write', str];
  const result = new C.IntegralValue(C.builtinTypes['int'], 0);
  yield ['result', result];
};
