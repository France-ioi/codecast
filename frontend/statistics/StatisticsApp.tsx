import React from "react";
import {Icon} from "@blueprintjs/core";
import classnames from 'classnames';
import {LogoutButton} from "../common/LogoutButton";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {LoginScreen} from "../common/LoginScreen";
import {StatisticsScreen} from "./StatisticsScreen";

interface StatisticsAppStateToProps {
    activity: string
}

function mapStateToProps(state: AppStore): StatisticsAppStateToProps {
    const user = state.user;
    const screen = state.screen;

    let activity;
    if (!user) {
        activity = 'login';
    } else if (screen === 'statistics') {
        activity = 'statistics';
    }

    return {activity};
}

interface StatisticsAppDispatchToProps {
    dispatch: Function
}

interface StatisticsAppProps extends StatisticsAppStateToProps, StatisticsAppDispatchToProps {

}

class _StatisticsApp extends React.PureComponent<StatisticsAppProps> {
    state = {collapsed: false};

    render () {
        const {collapsed} = this.state;
        const {activity} = this.props;

        const iconName = (collapsed) ? 'chevron-down' : 'chevron-up';

        let screen = <p>{'undefined state'}</p>;
        if (activity === 'statistics') {
            screen = <StatisticsScreen />;
        } else if (activity === 'login') {
            screen = <LoginScreen />;
        }

        return (
            <div id='statistics-app'>
                <div id='floating-controls' className={classnames({collapsed})}>
                    <span className='collapse-toggle' onClick={this._toggleCollapsed}>
                        <Icon icon={iconName} />
                    </span>
                    <div className='btn-group'>
                        {/statistics/.test(activity) &&
                            <LogoutButton />
                        }
                    </div>
                </div>
                {screen}
            </div>
        );
    }

    _toggleCollapsed = () => {
        const {collapsed} = this.state;

        this.setState({collapsed: !collapsed});
    };
}

export const StatisticsApp = connect(mapStateToProps)(_StatisticsApp);
