import React from "react";
import {ButtonGroup} from "@blueprintjs/core";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {getMessage} from "../lang";

interface LoginScreenStateToProps {
    baseUrl: string,
    authProviders: string[],
}

function mapStateToProps(state: AppStore): LoginScreenStateToProps {
    const {baseUrl, authProviders} = state.options;

    return {baseUrl, authProviders};
}

interface LoginScreenDispatchToProps {
    dispatch: Function
}

interface LoginScreenProps extends LoginScreenStateToProps, LoginScreenDispatchToProps {

}

class _LoginScreen extends React.PureComponent<LoginScreenProps> {
    render() {
        const {baseUrl, authProviders} = this.props;

        return (
            <div>
                <h3 style={{margin: '0 0 10px 0'}}>{getMessage('USER_SELECT_LOGIN_METHOD')}</h3>

                <ButtonGroup large={true} vertical={true}>
                    {authProviders && authProviders.map((provider) =>
                        <a
                            href={`${baseUrl}/auth/${provider}`}
                            target='login'
                            key={provider}
                            className='bp3-button'
                        >
                            {provider}
                        </a>
                    )}
                </ButtonGroup>
            </div>
        );
    }
}

export const LoginScreen = connect(mapStateToProps)(_LoginScreen);
