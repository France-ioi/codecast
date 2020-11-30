import playerSelectors from './selectors';
import playerReducers from './reducers';
import playerSagas from './sagas';
import PlayerControls from './controls';
import PlayerAppBundle from './app_view';

export default function (bundle, deps) {
    bundle.include(playerSelectors);
    bundle.include(playerReducers);
    bundle.include(playerSagas);
    bundle.include(PlayerControls);
    bundle.include(PlayerAppBundle);
};
