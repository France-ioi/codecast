
import React from 'react';
import {Button, ButtonGroup, Icon} from '@blueprintjs/core';

export default function (bundle) {
  bundle.defineAction('loginFeedback', 'Login.Feedback');
  bundle.addReducer('loginFeedback', loginFeedbackReducer);
  bundle.defineAction('logoutFeedback', 'Logout.Feedback');
  bundle.addReducer('logoutFeedback', logoutFeedbackReducer);
  bundle.defineView('LogoutButton', LogoutButtonSelector, LogoutButton);
  bundle.defineView('LoginScreen', LoginScreenSelector, LoginScreen);
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
        </ButtonGroup>
      </div>
    );
  }
}

function LoginScreenSelector (state, props) {
  const {loginFeedback} = state.get('actionTypes');
  const {baseUrl, authProviders} = state.get('options');
  return {baseUrl, authProviders, loginFeedback};
}

class LogoutButton extends React.PureComponent {
  render() {
    const {user, baseUrl} = this.props;
    if (!user || !user.login) return false;
    return (
      <a href={`${baseUrl}/logout`} target='_blank' className='btn btn-default'>
        <Icon icon='log-out'/>
        {` ${user.login}`}
      </a>
    );
  }
}

function LogoutButtonSelector (state, props) {
  const {baseUrl} = state.get('options');
  const {logoutFeedback} = state.get('actionTypes');
  const user = state.get('user');
  return {user, baseUrl, logoutFeedback};
}
