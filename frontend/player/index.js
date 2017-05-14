
import Immutable from 'immutable';

import playerActions from './actions';
import playerSelectors from './selectors';
import playerReducers from './reducers';
import playerSagas from './sagas';
import PlayerControls from './controls';
import PlayerAppBundle from './app_view';

export default function (bundle, deps) {

  bundle.addReducer('init', state => state.set('player', Immutable.Map({
    status: 'idle',
    audio: document.createElement('video')
  })));

  bundle.include(playerActions);
  bundle.include(playerSelectors);
  bundle.include(playerReducers);
  bundle.include(playerSagas);
  bundle.include(PlayerControls);
  bundle.include(PlayerAppBundle);

};
