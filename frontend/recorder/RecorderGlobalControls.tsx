import React from "react";
import {Icon} from "@blueprintjs/core";
import classnames from 'classnames';
import {LogoutButton} from "../common/LogoutButton";

export class RecorderGlobalControls extends React.PureComponent {
    render () {
        const {collapsed} = this.state;

        const iconName = (collapsed) ? 'chevron-down' : 'chevron-up';

        return (
            <div id='floating-controls' className={classnames({collapsed})}>
            <span className='collapse-toggle' onClick={this._toggleCollapsed}>
                <Icon icon={iconName}/>
            </span>
                <div className='btn-group'>
                    <LogoutButton />
                </div>
            </div>
        );
    }
    state = {collapsed: false};
    _toggleCollapsed = () => {
        const {collapsed} = this.state;
        this.setState({collapsed: !collapsed});
    };
}
