import React from "react";
import {ButtonGroup} from "@blueprintjs/core";
import {getMessage} from "../lang";
import {useAppSelector} from "../hooks";
import {useDispatch} from "react-redux";
import {ActionTypes as CommonActionTypes} from "./actionTypes";

export function LoginScreen() {
    const {baseUrl, authProviders} = useAppSelector(state => state.options);

    const dispatch = useDispatch();

    const openProvider = (provider) => {
        const providerUrl = `${baseUrl}/auth/${provider}`;

        const providerWindow = window.open(providerUrl);
        const channel = window.Channel.build({window: providerWindow, origin: '*', scope: 'login'});

        channel.bind('sendLoginFeedback', (instance, {user, error}) => {
            dispatch({type: CommonActionTypes.LoginFeedback, payload: {user, error}});
        });
    };

    return (
        <div>
            <h3 style={{margin: '0 0 10px 0'}}>{getMessage('USER_SELECT_LOGIN_METHOD')}</h3>

            <ButtonGroup large={true}>
                {authProviders && authProviders.map((provider) =>
                    <a
                        key={provider}
                        className='bp3-button'
                        onClick={() => openProvider(provider)}
                    >
                        {provider}
                    </a>
                )}
            </ButtonGroup>
        </div>
    );
}
