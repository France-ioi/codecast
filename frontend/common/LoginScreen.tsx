import React from "react";
import {ButtonGroup} from "@blueprintjs/core";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface LoginScreenStateToProps {
    baseUrl: string,
    authProviders: any
}

function mapStateToProps(state: AppStore): LoginScreenStateToProps {
    const {baseUrl, authProviders} = state.get('options');

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
            <div className='cc-login'>
                <h1 style={{margin: '20px 0'}}>{"Codecast"}</h1>
                <h3 style={{margin: '0 0 10px 0'}}>{"Select a login option"}</h3>

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
