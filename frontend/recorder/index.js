
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

import DevTools from '../utils/dev_tools';

import stepperComponent from '../stepper/index';
import {default as commonComponent, interpretQueryString} from '../common/index';
import saveScreenComponent from './save_screen';
import recorderActions from './actions';
import recorderStore from './store';
import recorderSagas from './sagas';
import RecorderControls from './controls';
import RecordScreen from './record_screen';
import App from './app_view';
import examples from '../common/examples';

const {store, scope, start} = link(function (bundle) {

  bundle.addReducer('init', _ => Immutable.Map({screen: 'record'}));

  bundle.include(stepperComponent);
  bundle.include(commonComponent);
  bundle.include(saveScreenComponent);
  bundle.include(recorderActions);
  bundle.include(recorderStore);
  bundle.include(recorderSagas);
  bundle.include(RecorderControls);
  bundle.include(RecordScreen);
  bundle.include(App);

  bundle.addEnhancer(DevTools.instrument());

});

const qs = queryString.parse(window.location.search);

store.dispatch({type: scope.init});
interpretQueryString(store, scope, qs);
start();
store.dispatch({type: scope.recorderPrepare});

const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><scope.App/></Provider>, container);
