
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
import Document from '../common/document';
import Terminal from '../common/terminal';

const App = EpicComponent(self => {

  const onStart = function () {
    self.props.dispatch({type: actions.playerStart});
  };

  self.render = function () {
    const {playerState, lastError, current} = self.props;
    const source = current && current.get('source');
    const stepper = current && current.get('stepper');
    const terminal = stepper && stepper.terminal;
    // current = {source: {document, selection}, translated, stepper}
    return (
      <div className="container">
        <Button onClick={onStart} disabled={playerState !== 'ready'}>
          <i className="fa fa-play"/>
        </Button>
        <div>{source && Document.toString(source.get('document'))}</div>
        <div>{terminal && <Terminal terminal={terminal}/>}</div>
        {lastError && <p>{lastError}</p>}
      </div>
    );
  };

});

const selector = function (state, props) {
  const player = state.get('player');
  const lastError = state.get('lastError');
  const playerState = player.get('state');
  const current = player.get('current');
  return {lastError, playerState, current};
};

const store = window.store = storeFactory();
const ConnectedApp = connect(selector)(App);
const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><ConnectedApp/></Provider>, container);

store.dispatch({type: actions.playerPrepare, audioUrl: '/assets/1.mp3', eventsUrl: '/assets/1.json'});
