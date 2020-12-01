import React from "react";
import {Icon} from "@blueprintjs/core";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface LogoutButtonStateToProps {
    user: any,
    baseUrl: string
}

function mapStateToProps(state: AppStore): LogoutButtonStateToProps {
    const {baseUrl} = state.get('options');
    const user = state.get('user');

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
                <Icon icon='log-out'/>
                {` ${user.login}`}
            </a>
        );
    }
}

export const LogoutButton = connect(mapStateToProps)(_LogoutButton);

