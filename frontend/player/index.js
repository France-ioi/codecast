
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider, connect} from 'react-redux';
import {Button} from 'react-bootstrap';
import EpicComponent from 'epic-component';
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
import '../style.css!';

import storeFactory from './store';
import actions from './actions';
import Editor from '../common/editor';
import Terminal from '../common/terminal';
import StackView from '../common/stack_view';

const App = EpicComponent(self => {

  const onStart = function () {
    self.props.dispatch({type: actions.playerStart});
  };

  const onSourceInit = function (editor) {
    self.props.dispatch({type: actions.playerSourceInit, editor});
  };

  const onSourceEdit = function () {
    // TODO
  };

  const onSourceSelect = function () {
    // TODO
  };

  self.render = function () {
    const {playerState, lastError, current} = self.props;
    const currentState = current && current.state;
    const source = current && currentState.get('source');
    const stepper = current && currentState.get('stepper');
    const terminal = stepper && stepper.terminal;
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-3">
            {lastError && <p>{lastError}</p>}
          </div>
          <div className="col-md-6">
            <Button onClick={onStart} disabled={playerState !== 'ready'}>
              <i className="fa fa-play"/>
            </Button>
          </div>
          <div className="col-md-3">
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            {stepper &&
              <div>
                <h2>Pile</h2>
                <StackView state={stepper}/>
              </div>}
          </div>
          <div className="col-md-6">
            <h2>Source C</h2>
            <Editor onInit={onSourceInit} onEdit={onSourceEdit} onSelect={onSourceSelect}
                    readOnly={true} width='100%' height='336px' />
          </div>
          <div className="col-md-3">
            {terminal &&
              <div>
                <h2>Terminal</h2>
                <Terminal terminal={terminal}/>
              </div>}
          </div>
        </div>
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

const qs = queryString.parse(window.location.search);
store.dispatch({
  type: actions.playerPrepare,
  audioUrl: `https://fioi-recordings.s3.amazonaws.com/uploads/${qs.id}.mp3`,
  eventsUrl: `https://fioi-recordings.s3.amazonaws.com/uploads/${qs.id}.json`
});
