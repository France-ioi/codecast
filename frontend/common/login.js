
import React from 'react';
import {Button, ButtonGroup} from '@blueprintjs/core';

export default function (bundle) {
  bundle.addReducer('init', initReducer);
  bundle.defineAction('loginFeedback', 'Login.Feedback');
  bundle.addReducer('loginFeedback', loginFeedbackReducer);
  bundle.defineAction('logoutFeedback', 'Logout.Feedback');
  bundle.addReducer('logoutFeedback', logoutFeedbackReducer);
  bundle.defineView('LogoutButton', LogoutButtonSelector, LogoutButton);
  bundle.defineView('LoginScreen', LoginScreenSelector, LoginScreen);
}

function initReducer (state, {payload: {user}}) {
  if (!user) {
    try {
      user = JSON.parse(window.localStorage.user || 'null');
    } catch (ex) {
      user = null;
    }
  }
  return user ? loginFeedbackReducer(state, {payload: {user}}) : state;
}

function loginFeedbackReducer (state, {payload: {user, error}}) {
  if (error) return state; // XXX
  window.localStorage.user = JSON.stringify(user);
  return state.set('user', user);
}

function logoutFeedbackReducer (state, _action) {
  window.localStorage.user = '';
  return state.set('user', false);
}

class LoginScreen extends React.PureComponent {
  render() {
    const {baseUrl, authProviders} = this.props;
    return (
      <div className='cc-login'>
        <h1 style={{margin: '20px 0'}}>{"Codecast"}</h1>
        <h3 style={{margin: '0 0 10px 0'}}>{"Select a login option"}</h3>
        <ButtonGroup large={true} vertical={true}>
          {authProviders && authProviders.map((provider) =>
            <a href={`${baseUrl}/auth/${provider}`} target='_blank' key={provider} className='pt-button'>{provider}</a>)}
          <Button onClick={this._authAsGuest}>{"guest"}</Button>
        </ButtonGroup>
      </div>
    );
  }
  _authAsGuest = () => {
    this.props.dispatch({type: this.props.loginFeedback, payload: {user: {guest: true}}});
  };
}

function LoginScreenSelector (state, props) {
  const {loginFeedback} = state.get('actionTypes');
  const {baseUrl, authProviders} = state.get('options');
  return {baseUrl, authProviders, loginFeedback};
}

class LogoutButton extends React.PureComponent {
  render() {
    const {user, baseUrl} = this.props;
    if (!user || !(user.login || user.guest)) return false;
    if (user.guest) {
      return (
        <Button onClick={this.logoutGuest}>
          <i className='fa fa-sign-out'/>
          {" guest"}
        </Button>
      );
    } else {
      return (
        <a href={`${baseUrl}/logout`} target='_blank' className='btn btn-default'>
          <i className='fa fa-sign-out'/>
          {` ${user.login}`}
        </a>
      );
    }
  }
  logoutGuest = () => {
    this.props.dispatch({type: this.props.logoutFeedback});
  };
}

function LogoutButtonSelector (state, props) {
  const {baseUrl} = state.get('options');
  const {logoutFeedback} = state.get('actionTypes');
  const user = state.get('user');
  return {user, baseUrl, logoutFeedback};
}
