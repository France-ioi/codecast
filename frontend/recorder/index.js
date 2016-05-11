
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

import {link, include, addReducer, addEnhancer} from '../utils/linker';
import DevTools from '../utils/dev_tools';

import stepperComponent from '../stepper/index';
import commonComponent from '../common/index';
import homeScreenComponent from './home_screen';
import prepareScreenComponent from './prepare_screen';
import saveScreenComponent from './save_screen';
import recorderActions from './actions';
import recorderSelectors from './selectors';
import recorderReducers from './reducers';
import recorderSagas from './sagas';
import RecorderControls from './controls_view';
import RecordScreen from './record_screen';
import App from './app_view';
import examples from './examples'

const {store, scope, start} = link(function* () {

  yield include(stepperComponent);
  yield include(commonComponent);
  yield include(homeScreenComponent);
  yield include(prepareScreenComponent);
  yield include(saveScreenComponent);
  yield include(recorderActions);
  yield include(recorderSelectors);
  yield include(recorderReducers);
  yield include(recorderSagas);
  yield include(RecorderControls);
  yield include(RecordScreen);
  yield include(App);

  yield addEnhancer(DevTools.instrument());

  yield addReducer('init', _ => Immutable.Map({
    screen: 'home',
    home: Immutable.Map({
      screen: Immutable.Map({})
    }),
    prepare: Immutable.Map({examples})
  }));

});

store.dispatch({type: scope.init});
start();
store.dispatch({type: scope.recorderPrepare});

const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><scope.App/></Provider>, container);
