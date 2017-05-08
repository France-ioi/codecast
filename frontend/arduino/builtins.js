
export default {pinMode, digitalWrite, digitalRead};

function* pinMode (context, pin, dir) {
  yield ['pinMode', pin, dir];
};

function* digitalWrite (context, pin, level) {
  yield ['digitalWrite', pin, level];
};

function* digitalRead (context, pin) {
  const level = yield ['digitalRead', pin];
  yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
};

/*
analogRead(pin)
  return pinLevel[pin] * 255
analogWrite(pin, value) (pas demandé)
*/
