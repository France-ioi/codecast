
import React from 'react';
import EpicComponent from 'epic-component';
import {Alert} from 'react-bootstrap';
import {take} from 'redux-saga/effects';

import {use, addReducer, addSaga, defineAction, defineSelector, defineView} from '../utils/linker';

export default function* (deps) {

  // Sent when a generic error has occurred.
  yield defineAction('error', 'System.Error');
  yield defineAction('clearError', 'System.Error.Clear');

  // Log errors to the console.
  yield addSaga(function* watchError () {
    while (true) {
      const action = yield take(deps.error);
      console.error(action.error);
    }
  });

  yield addReducer('error', function (state, action) {
    return state.set('error', action.error);
  });

  yield addReducer('clearError', function (state, action) {
    return state.delete('error');
  });

  yield defineSelector('ErrorViewSelector', function (state, props) {
    const error = state.get('error');
    return {error};
  });

  yield defineView('ErrorView', 'ErrorViewSelector', EpicComponent(self => {

    const onClearError = function () {
      self.props.dispatch({type: 'clearError'});
    };

    self.render = function () {
      const {error} = self.props;
      if (!error) {
        return false;
      }
      return (
        <div className="row">
          <div className="col-md-12">
            <Alert bsStyle="danger" onDismiss={onClearError}>
              <h4>Une erreur est survenue !</h4>
              <p>{error.toString()}</p>
            </Alert>
          </div>
        </div>
      );
    };

  }));

};
