
import React from 'react';
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

  class ErrorView extends React.PureComponent {

    onClearError = () => {
      this.props.dispatch({type: deps.clearError});
    };

    render () {
      const {error, getMessage} = this.props;
      if (!error) {
        return false;
      }
      return (
        <div className="row">
          <div className="col-sm-12">
            <Alert bsStyle="danger" onDismiss={this.onClearError}>
              <h4>{getMessage('AN_ERROR_OCCURRED')}</h4>
              <p>{error.toString()}</p>
            </Alert>
          </div>
        </div>
      );
    }

  }
  bundle.defineView('ErrorView', 'ErrorViewSelector', ErrorView);

};
