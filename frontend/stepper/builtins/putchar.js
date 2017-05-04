
export function* putchar (context, charCode) {
  const ch = String.fromCharCode(charCode.toInteger());
  yield ['write', ch];
  yield ['result', charCode];
};
