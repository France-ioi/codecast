
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

import 'bootstrap/css/bootstrap.min.css!';
import 'font-awesome/css/font-awesome.min.css!';
import '../common/style.css!';

import link from '../common/linker';

import * as commonActions from '../common/actions';
import * as stepperActions from '../stepper/actions';
import * as homeScreenActions from './home_screen/actions';
import * as prepareScreenActions from './prepare_screen/actions';
import * as recordScreenActions from './record_screen/actions';
import * as saveScreenActions from './save_screen/actions';

import * as commonReducers from '../common/reducers';
import * as stepperReducers from '../stepper/reducers';
import * as homeScreenReducers from './home_screen/reducers';
import * as prepareScreenReducers from './prepare_screen/reducers';
import * as recordScreenReducers from './record_screen/reducers';
import * as saveScreenReducers from './save_screen/reducers';

import commonSagas from '../common/sagas';
import stepperSagas from '../stepper/sagas';
import homeScreenSagas from './home_screen/sagas';
import prepareScreenSagas from './prepare_screen/sagas';
import recordScreenSagas from './record_screen/sagas';
import saveScreenSagas from './save_screen/sagas';

import HomeScreenFactory from './home_screen/view';
import PrepareScreenFactory from './prepare_screen/view';
import RecorderControlsFactory from './record_screen/controls_view';
import RecordScreenFactory from './record_screen/view';
import SaveScreenFactory from './save_screen/view';
import AppFactory from './app_view';

import * as selectors from './selectors';

const {store, views} = link({
  actionMaps: [
    commonActions,
    stepperActions,
    homeScreenActions,
    prepareScreenActions,
    recordScreenActions,
    saveScreenActions
  ],
  reducerMaps: [
    commonReducers,
    stepperReducers,
    homeScreenReducers,
    prepareScreenReducers,
    recordScreenReducers,
    saveScreenReducers
  ],
  sagaFactories: [
    commonSagas,
    stepperSagas,
    homeScreenSagas,
    prepareScreenSagas,
    recordScreenSagas,
    saveScreenSagas
  ],
  viewFactories: {
    HomeScreen: HomeScreenFactory,
    PrepareScreen: PrepareScreenFactory,
    RecordScreen: RecordScreenFactory,
    RecorderControls: RecorderControlsFactory,
    SaveScreen: SaveScreenFactory,
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
