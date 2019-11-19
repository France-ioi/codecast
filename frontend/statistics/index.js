import Immutable from 'immutable';
import React from 'react';
import classnames from 'classnames';
import {Icon} from '@blueprintjs/core';
import {put, select, take, takeEvery} from 'redux-saga/effects';



export default function (bundle, deps) {

  bundle.addReducer('init', state =>
    state.set('statistics', Immutable.Map()));

  bundle.defineAction('statisticsPrepare', 'Statistics.Prepare');
  // bundle.addReducer('editorPrepare', editorPrepareReducer);
  // bundle.addReducer('loginFeedback', loginFeedbackReducer);

  bundle.defineView('StatisticsApp', StatisticsAppSelector, StatisticsApp);
  bundle.defineView('StatisticsScreen', StatisticsScreenSelector, StatisticsScreen);

  bundle.addSaga(function* editorSaga (app) {
    yield takeEvery(app.actionTypes.statisticsPrepare, statisticsPrepareSaga, app);
  });

  //bundle.include(TrimBundle);

};

function* statisticsPrepareSaga ({actionTypes}) {
  /* Require the user to be logged in. */
  while (!(yield select(state => state.get('user')))) {
    yield take(actionTypes.loginFeedback);
  }
  yield put({type: actionTypes.switchToScreen, payload: {screen: 'statistics'}});
}


function StatisticsAppSelector (state, props) {
  const scope = state.get('scope');
  const user = state.get('user');
  const screen = state.get('screen');
  const {LogoutButton} = scope;
  let activity, screenProp, Screen;
  if (!user) {
    activity = 'login';
    screenProp = 'LoginScreen';
  } else if (screen === 'statistics') {
    activity = 'statistics';
    screenProp = 'StatisticsScreen';
  } else {
    Screen = () => <p>{'undefined state'}</p>;
  }
  if (!Screen && screenProp) {
    Screen = scope[screenProp];
  }
  return {Screen, activity, LogoutButton};
}

class StatisticsApp extends React.PureComponent {
  render () {
    const {collapsed} = this.state;
    const {Screen, activity, LogoutButton} = this.props;
    return (
      <div id='statistics-app'>
        <div id='floating-controls' className={classnames({collapsed})}>
          <span className='collapse-toggle' onClick={this._toggleCollapsed}>
            <Icon icon={`chevron-${collapsed ? 'down' : 'up'}`} />
          </span>
          <div className='btn-group'>
            {/statistics/.test(activity) && <LogoutButton />}
          </div>
        </div>
        <Screen />
      </div>
    );
  }
  state = {collapsed: false};
  _toggleCollapsed = () => {
    const {collapsed} = this.state;
    this.setState({collapsed: !collapsed});
  };
}

function StatisticsScreenSelector (state, props) {
  const viewportTooSmall = state.get('viewportTooSmall');
  const containerWidth = state.get('containerWidth');
  return {
    viewportTooSmall, containerWidth
  };
}

class StatisticsScreen extends React.PureComponent {
  render () {
    const {containerWidth, viewportTooSmall} = this.props;
    return (
      <div id='main' style={{width: `${containerWidth}px`}} className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
        <p>Statistics</p>
      </div>
    );
  }
}

