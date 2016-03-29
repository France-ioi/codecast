
export const printf = function (state, cont, values) {
  // Unbox each argument's value.
  const args = values.slice(1).map(v => v[1]);
  const str = sprintf.apply(null, args);
  const result = str.length;
  const terminal = state.terminal.write(str)
  return {control: cont, terminal, result};
};
