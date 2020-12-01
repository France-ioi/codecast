import playerSelectors from './selectors';
import playerReducers from './reducers';
import playerSagas from './sagas';

export default function (bundle, deps) {
    bundle.include(playerSelectors);
    bundle.include(playerReducers);
    bundle.include(playerSagas);
};
