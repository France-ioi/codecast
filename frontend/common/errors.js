
import React from 'react';
import EpicComponent from 'epic-component';
import {Alert} from 'react-bootstrap';
import {take} from 'redux-saga/effects';

export default function (bundle, deps) {

  // Sent when a generic error has occurred.
  bundle.defineAction('error', 'System.Error');
  bundle.defineAction('clearError', 'System.Error.Clear');

  // Log errors to the console.
  bundle.addSaga(function* watchError () {
    while (true) {
      const action = yield take(deps.error);
      console.error(action.error);
    }
  });

  bundle.addReducer('error', function (state, action) {
    return state.set('error', action.error);
  });

  bundle.addReducer('clearError', function (state, action) {
    return state.delete('error');
  });

  bundle.defineSelector('ErrorViewSelector', function (state, props) {
    const getMessage = state.get('getMessage');
    const error = state.get('error');
    return {getMessage, error};
  });

  bundle.defineView('ErrorView', 'ErrorViewSelector', EpicComponent(self => {

    const onClearError = function () {
      self.props.dispatch({type: 'clearError'});
    };

    self.render = function () {
      const {error, getMessage} = self.props;
      if (!error) {
        return false;
      }
      return (
        <div className="row">
          <div className="col-sm-12">
            <Alert bsStyle="danger" onDismiss={onClearError}>
              <h4>{getMessage('AN_ERROR_OCCURRED')}</h4>
              <p>{error.toString()}</p>
            </Alert>
          </div>
        </div>
      );
    };

  }));

};
