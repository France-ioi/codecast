
export function* delay (context, millis) {
  yield ['delay', millis];
};
