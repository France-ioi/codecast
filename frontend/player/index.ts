import playerReducers from './reducers';
import playerSagas from './sagas';

export default function(bundle) {
    bundle.include(playerReducers);
    bundle.include(playerSagas);
};
