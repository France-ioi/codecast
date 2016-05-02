
export * from '../common/selectors';
export * from '../stepper/selectors';

export function getPlayerState (state) {
  return state.get('player');
};

export function App (state, props) {
  const player = state.get('player');
  const lastError = state.get('lastError');
  const playerState = player.get('state');
  const current = player.get('current');
  return {lastError, playerState, current};
};
