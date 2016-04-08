
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
// import './style.css!';

import storeFactory from './store';
import actions from './actions';

const App = EpicComponent(self => {

  self.render = function () {
    const {lastError} = self.props;
    return (
      <div className="container">
        <p>Player</p>
        {lastError && <p>{lastError}</p>}
      </div>
    );
  };

});

const selector = function (state, props) {
  const lastError = state.get('lastError');
  return {lastError};
};

const store = window.store = storeFactory();
const ConnectedApp = connect(selector)(App);
const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><ConnectedApp/></Provider>, container);
