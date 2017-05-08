import update from 'immutability-helper';

export default function addArduinoEffects (effects) {
  effects.set('pinMode', pinMode);
  effects.set('digitalWrite', digitalWrite);
  effects.set('digitalRead', digitalRead);
};

function* pinMode (context, pin, dir) {
  const port = context.state.ports[pin];
  context.state.ports[pin] = {...port, dir: dir.toInteger()};
}

function* digitalWrite (context, pin, level) {
  const ports = context.state;
  const port = ports[pin];
  context.state = update(context.state,
    {ports: {[pin]: {output: {$set: level.toInteger()}}}});
}

function* digitalRead (context, pin) {
  return context.state.ports[pin].input;
}
