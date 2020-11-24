import React from "react";
import {Icon} from "@blueprintjs/core";
import classnames from 'classnames';

interface EditorAppProps {
    activity: any,
    floatingControls: any
}

export class EditorApp extends React.PureComponent<EditorAppProps> {
    state = {collapsed: false};

    render() {
        const {activity, floatingControls} = this.props;
        const {collapsed} = this.state;
        return (
            <div id='editor-app'>
                <div id='floating-controls' className={classnames({collapsed})}>
          <span className='collapse-toggle' onClick={this._toggleCollapsed}>
            <Icon icon={`chevron-${collapsed ? 'down' : 'up'}`}/>
          </span>
                    <div className='btn-group'>
                        {floatingControls.map((Component, i) => <Component key={i}/>)}
                        {/load|setup/.test(activity) && <LogoutButton/>}
                    </div>
                </div>
                <Screen/>
            </div>
        );
    }

    _toggleCollapsed = () => {
        const {collapsed} = this.state;
        this.setState({collapsed: !collapsed});
    };
}
