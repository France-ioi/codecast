
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider, connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import 'brace';
// For jspm bundle-sfx, ensure that jspm-0.16.config.js has a meta entry
// listing brace as a dependency for each of these modules, otherwise the
// bundle will complain about an undefined "ace" global variable.
import 'brace/worker/javascript';
import 'brace/mode/c_cpp';
import 'brace/theme/github';

import 'bootstrap/css/bootstrap.min.css!';
import 'font-awesome/css/font-awesome.min.css!';
import './style.css!';

import storeFactory from './store';
import DevTools from './dev_tools';
import HomeScreen from './home_screen/view';
import PrepareScreen from './prepare_screen/view';
import RecordScreen from './recorder/screen';
import SaveScreen from './save_screen/view';

const App = EpicComponent(self => {

  self.render = function () {
    const {screen} = self.props;
    return (
      <div className="container">
        {screen === 'home' && <HomeScreen/>}
        {screen === 'prepare' && <PrepareScreen/>}
        {screen === 'record' && <RecordScreen/>}
        {screen === 'save' && <SaveScreen/>}
        {false && <DevTools/>}
        <canvas id="vumeter" width="10" height="100"></canvas>
      </div>
    );
  };

});

const appSelector = function (state, props) {
  const screen = state.get('screen');
  return {screen};
};

const store = storeFactory();
const ConnectedApp = connect(appSelector)(App);
const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><ConnectedApp/></Provider>, container);
