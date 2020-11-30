import {ButtonGroup} from "@blueprintjs/core";
import React from "react";

interface LoginScreenProps {
    baseUrl: string,
    authProviders: any
}

export class LoginScreen extends React.PureComponent<LoginScreenProps> {
    render() {
        const {baseUrl, authProviders} = this.props;
        return (
            <div className='cc-login'>
                <h1 style={{margin: '20px 0'}}>{"Codecast"}</h1>
                <h3 style={{margin: '0 0 10px 0'}}>{"Select a login option"}</h3>
                <ButtonGroup large={true} vertical={true}>
                    {authProviders && authProviders.map((provider) =>
                        <a href={`${baseUrl}/auth/${provider}`} target='login' key={provider}
                           className='bp3-button'>{provider}</a>)}
                </ButtonGroup>
            </div>
        );
    }
}
