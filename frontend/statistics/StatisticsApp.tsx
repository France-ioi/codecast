import React from "react";
import {Icon} from "@blueprintjs/core";
import classnames from 'classnames';
import { LogoutButton } from "../common/LogoutButton";

interface StatisticsAppProps {
    activity: any
}

export class StatisticsApp extends React.PureComponent<StatisticsAppProps> {
    render () {
        const {collapsed} = this.state;
        const {activity} = this.props;

        const iconName = (collapsed) ? 'chevron-down' : 'chevron-up';

        return (
            <div id='statistics-app'>
                <div id='floating-controls' className={classnames({collapsed})}>
                    <span className='collapse-toggle' onClick={this._toggleCollapsed}>
                        <Icon icon={iconName} />
                    </span>
                    <div className='btn-group'>
                        {/statistics/.test(activity) && <LogoutButton />}
                    </div>
                </div>

                <Screen />
            </div>
        );
    }
    state = {collapsed: false};
    _toggleCollapsed = () => {
        const {collapsed} = this.state;
        this.setState({collapsed: !collapsed});
    };
}
