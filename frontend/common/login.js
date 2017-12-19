
import React from 'react';
import {Button} from 'react-bootstrap';

module.exports = function (bundle, deps) {

  bundle.defineAction('loginFeedback', 'Login.Feedback');
  bundle.addReducer('loginFeedback', function (state, {payload: {user, error}}) {
    if (error) return state; // XXX
    return state.set('user', user);
  });

  bundle.defineAction('logoutFeedback', 'Logout.Feedback');
  bundle.addReducer('logoutFeedback', function (state, action) {
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
      const {baseUrl, authProviders, size} = this.props;
      return (
        <div className={`container size-${size}`}>
          <p>{"Login options:"}</p>
          {authProviders && authProviders.map((provider) =>
            <a href={`${baseUrl}/auth/${provider}`} target='_blank' key={provider} className='btn btn-default'>{provider}</a>)}
          <Button onClick={this._authAsGuest}>{"guest"}</Button>
        </div>
      );
    }
    _authAsGuest = () => {
      this.props.dispatch({type: deps.loginFeedback, payload: {user: {guest: true}}});
    };
  }
  function LoginScreenSelector (state, props) {
    const baseUrl = state.get('baseUrl');
    const size = state.get('size');
    const authProviders = state.get('authProviders');
    return {baseUrl, size, authProviders};
  }
  bundle.defineView('LoginScreen', LoginScreenSelector, LoginScreen);

};
