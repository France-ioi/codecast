
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import Immutable from 'immutable';

import 'brace';
// For jspm bundle-sfx, ensure that jspm-0.16.config.js has a meta entry
// listing brace as a dependency for each of these modules, otherwise the
// bundle will complain about an undefined "ace" global variable.
import 'brace/worker/javascript';
import 'brace/mode/c_cpp';
import 'brace/theme/github';

import link from '../common/linker';

import 'bootstrap/css/bootstrap.min.css!';
import 'font-awesome/css/font-awesome.min.css!';
import '../common/style.css!';

import * as commonActions from '../common/actions';
import * as homeScreenActions from '../home_screen/actions';
import * as prepareScreenActions from '../prepare_screen/actions';
import * as stepperActions from '../stepper/actions';
import * as saveScreenActions from '../save_screen/actions';
import * as recorderActions from './actions';

import * as commonReducers from '../common/reducers';
import * as homeScreenReducers from '../home_screen/reducers';
import * as prepareScreenReducers from '../prepare_screen/reducers';
import * as stepperReducers from '../stepper/reducers';
import * as saveScreenReducers from '../save_screen/reducers';
import * as recorderReducers from './reducers';

import commonSagas from '../common/sagas';
import homeScreenSagas from '../home_screen/sagas';
import prepareScreenSagas from '../prepare_screen/sagas';
import stepperSagas from '../stepper/sagas';
import saveScreenSagas from '../save_screen/sagas';
import recorderSagas from './sagas';

import HomeScreenFactory from '../home_screen/view';
import PrepareScreenFactory from '../prepare_screen/view';
import SaveScreenFactory from '../save_screen/view';
import RecorderControlsFactory from './controls';
import RecordScreenFactory from './screen';
import AppFactory from './app_view';

import * as selectors from './selectors';

const {store, views} = link({
  actionMaps: [
    commonActions,
    homeScreenActions,
    prepareScreenActions,
    stepperActions,
    saveScreenActions,
    recorderActions
  ],
  reducerMaps: [
    commonReducers,
    homeScreenReducers,
    prepareScreenReducers,
    stepperReducers,
    recorderReducers,
    saveScreenReducers
  ],
  sagaFactories: [
    commonSagas,
    homeScreenSagas,
    prepareScreenSagas,
    recorderSagas,
    stepperSagas,
    saveScreenSagas
  ],
  viewFactories: {
    HomeScreen: HomeScreenFactory,
    SaveScreen: SaveScreenFactory,
    RecordScreen: RecordScreenFactory,
    RecorderControls: RecorderControlsFactory,
    PrepareScreen: PrepareScreenFactory,
    App: AppFactory
  },
  selectors,
  initialState: Immutable.Map({
    screen: 'home',
    home: Immutable.Map({
      screen: Immutable.Map({})
    })
  })
});

const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><views.App/></Provider>, container);
