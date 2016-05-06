
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import Immutable from 'immutable';
import queryString from 'query-string';

import 'brace';
// For jspm bundle-sfx, ensure that jspm-0.16.config.js has a meta entry
// listing brace as a dependency for each of these modules, otherwise the
// bundle will complain about an undefined "ace" global variable.
import 'brace/worker/javascript';
import 'brace/mode/c_cpp';
import 'brace/theme/github';

import 'bootstrap/css/bootstrap.min.css!';
import 'font-awesome/css/font-awesome.min.css!';
import '../common/style.css!';

import link from '../common/linker';

import * as commonActions from '../common/actions';
import * as stepperActions from '../stepper/actions';
import * as playerActions from './actions';

import * as commonReducers from '../common/reducers';
import * as stepperReducers from '../stepper/reducers';
import * as playerReducers from './reducers';

import commonSagas from '../common/sagas';
import stepperSagas from '../stepper/sagas';
import playerSagas from './sagas';

import StackViewFactory from '../stepper/stack_view';
import DirectivesPaneFactory from '../stepper/directives_pane';
import AppFactory from './app_view';

import * as selectors from './selectors';

const {actionTypes, store, views} = link({
  actionMaps: [
    commonActions,
    stepperActions,
    playerActions
  ],
  reducerMaps: [
    commonReducers,
    stepperReducers,
    playerReducers
  ],
  sagaFactories: [
    commonSagas,
    stepperSagas,
    playerSagas
  ],
  viewFactories: {
    App: AppFactory,
    DirectivesPane: DirectivesPaneFactory,
    StackView: StackViewFactory
  },
  selectors,
  initialState: Immutable.Map({
    player: Immutable.Map({
      state: 'idle'
    })
  })
});

const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><views.App/></Provider>, container);

const qs = queryString.parse(window.location.search);
store.dispatch({
  type: actionTypes.playerPrepare,
  audioUrl: `https://fioi-recordings.s3.amazonaws.com/uploads/${qs.id}.mp3`,
  eventsUrl: `https://fioi-recordings.s3.amazonaws.com/uploads/${qs.id}.json`
});
