import React from "react";
import {Icon} from "@blueprintjs/core";
import classnames from 'classnames';

export class RecorderGlobalControls extends React.PureComponent {
    render () {
        const {collapsed} = this.state;
        return (
            <div id='floating-controls' className={classnames({collapsed})}>
        <span className='collapse-toggle' onClick={this._toggleCollapsed}>
          <Icon icon={`chevron-${collapsed ? 'down' : 'up'}`}/>
        </span>
                <div className='btn-group'>
                    <LogoutButton/>
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
