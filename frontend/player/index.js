
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import Immutable from 'immutable';
import queryString from 'query-string';
import link from 'epic-linker';

import 'brace';
// For jspm bundle-sfx, ensure that jspm-0.16.config.js has a meta entry
// listing brace as a dependency for each of these modules, otherwise the
// bundle will complain about an undefined "ace" global variable.
import 'brace/worker/javascript';
import 'brace/mode/c_cpp';
import 'brace/theme/github';

import 'font-awesome/css/font-awesome.min.css';
import '../style.scss';
import '../slider.css';

import stepperComponent from '../stepper/index';
import {default as commonComponent, interpretQueryString} from '../common/index';
import playerActions from './actions';
import playerSelectors from './selectors';
import playerReducers from './reducers';
import playerSagas from './sagas';
import PlayerControls from './controls';
import App from './app_view';

const {store, scope, start} = link(function (bundle) {

  bundle.addReducer('init', _ => Immutable.Map({
    player: Immutable.Map({
      status: 'idle',
      audio: new Audio()
    })
  }));

  bundle.include(stepperComponent);
  bundle.include(commonComponent);
  bundle.include(playerActions);
  bundle.include(playerSelectors);
  bundle.include(playerReducers);
  bundle.include(playerSagas);
  bundle.include(PlayerControls);
  bundle.include(App);

});

const qs = queryString.parse(window.location.search);

store.dispatch({type: scope.init});
interpretQueryString(store, scope, qs);
start();

const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><scope.App/></Provider>, container);

if (qs.id) {
  const getResourceUrl = store.getState().get('getResourceUrl');
  store.dispatch({
    type: scope.playerPrepare,
    audioUrl: getResourceUrl(qs.id, 'mp3'),
    eventsUrl: getResourceUrl(qs.id, 'json')
  });
} else if (qs.base) {
  store.dispatch({
    type: scope.playerPrepare,
    audioUrl: `${qs.base}.mp3`,
    eventsUrl: `${qs.base}.json`
  });
}
