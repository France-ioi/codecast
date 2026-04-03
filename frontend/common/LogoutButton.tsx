import React from "react";
import {LogOut} from "@blueprintjs/icons";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface LogoutButtonStateToProps {
    user: any,
    baseUrl: string
}

function mapStateToProps(state: AppStore): LogoutButtonStateToProps {
    const {baseUrl} = state.options;
    const user = state.user;

    return {user, baseUrl};
}

interface LogoutButtonDispatchToProps {
    dispatch: Function
}

interface LogoutButtonProps extends LogoutButtonStateToProps, LogoutButtonDispatchToProps {

}

class _LogoutButton extends React.PureComponent<LogoutButtonProps> {
    render() {
        const {user, baseUrl} = this.props;
        if (!user || !user.login) {
            return false;
        }

        return (
            <a href={`${baseUrl}/logout`} target='login' className='btn btn-default'>
                <LogOut/>
                {` ${user.login}`}
            </a>
        );
    }
}

export const LogoutButton = connect(mapStateToProps)(_LogoutButton);

