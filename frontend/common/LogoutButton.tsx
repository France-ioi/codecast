import React from "react";
import {Icon} from "@blueprintjs/core";

interface LogoutButtonProps {
    user: any,
    baseUrl: string
}

export class LogoutButton extends React.PureComponent<LogoutButtonProps> {
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
