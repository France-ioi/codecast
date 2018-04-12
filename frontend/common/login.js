
import React from 'react';
import {Button, ButtonGroup} from '@blueprintjs/core';

module.exports = function (bundle, deps) {

  bundle.defineAction('loginFeedback', 'Login.Feedback');
  bundle.addReducer('loginFeedback', function (state, {payload: {user, error}}) {
    if (error) return state;
    window.localStorage.user = JSON.stringify(user);
    return state.set('user', user);
  });

  bundle.defineAction('logoutFeedback', 'Logout.Feedback');
  bundle.addReducer('logoutFeedback', function (state, action) {
    window.localStorage.user = '';
    return state.set('user', false);
  });

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
      this.props.dispatch({type: deps.logoutFeedback});
    };
  }
  function LogoutViewSelector (state, props) {
    const baseUrl = state.get('baseUrl');
    const user = state.get('user');
    return {user, baseUrl};
  }
  bundle.defineView('LogoutButton', LogoutViewSelector, LogoutButton);

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
      this.props.dispatch({type: deps.loginFeedback, payload: {user: {guest: true}}});
    };
  }
  function LoginScreenSelector (state, props) {
    const baseUrl = state.get('baseUrl');
    const authProviders = state.get('authProviders');
    return {baseUrl, authProviders};
  }
  bundle.defineView('LoginScreen', LoginScreenSelector, LoginScreen);

};
