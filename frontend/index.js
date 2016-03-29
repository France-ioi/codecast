
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider, connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import 'brace';
import 'brace/worker/javascript';
import 'brace/mode/c_cpp';
import 'brace/theme/github';

import 'bootstrap/css/bootstrap.min.css!';
import 'font-awesome/css/font-awesome.min.css!';

import DevTools from './dev_tools';
import {storeFactory, ReduxDevTools} from './store';
import HomeScreen from './home_screen/view';
import RecordingScreen from './recording_screen/view';

const App = EpicComponent(self => {

  self.render = function () {
    const {screen} = self.props;
    return (
      <div className="container">
        {screen === 'home' && <HomeScreen/>}
        {screen === 'recording' && <RecordingScreen/>}
        <DevTools/>
      </div>
    );
  };

});

const appSelector = function (state, props) {
  const {screen} = state;
  return {screen};
};

const store = storeFactory();
const ConnectedApp = connect(appSelector)(App);
const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><ConnectedApp/></Provider>, container);
