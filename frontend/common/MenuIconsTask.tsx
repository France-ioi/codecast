import React from 'react';
import {Button} from '@blueprintjs/core';
import {FullscreenButton} from "./FullscreenButton";
import {SubtitlesMenu} from "../subtitles/SubtitlesMenu";
import {connect} from "react-redux";

function mapStateToProps() {
    return {};
}

interface MenuIconsTaskDispatchToProps {
    dispatch: Function
}

interface MenuIconsTaskProps extends MenuIconsTaskDispatchToProps {
    toggleMenu: () => void,
}

class _MenuIconsTask extends React.PureComponent<MenuIconsTaskProps> {
    state = {isOpen: false};

    render() {
        return (
            <div id='menu'>
                <div className="menu-task-elements">
                    <div className="menu-task-element is-blue">
                        <FullscreenButton />
                    </div>
                    <div className="menu-task-element">
                        <SubtitlesMenu />
                    </div>
                    <div className="menu-task-element">
                        <Button onClick={this.props.toggleMenu} icon='menu'/>
                    </div>
                </div>
            </div>
        );
    }
}

export const MenuIconsTask = connect(mapStateToProps)(_MenuIconsTask);
