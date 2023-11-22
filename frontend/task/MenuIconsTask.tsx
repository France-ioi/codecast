import React from 'react';
import {Button} from '@blueprintjs/core';
import {FullscreenButton} from "../common/FullscreenButton";
import {useAppSelector} from "../hooks";
import {ActionTypes as CommonActionTypes, ActionTypes} from "../common/actionTypes";
import {useDispatch} from "react-redux";
import {Screen} from '../common/screens';

import {selectAvailableHints} from './hints/hints_selectors';
import {selectShowDocumentation} from './documentation/doc';

interface MenuIconsTaskProps {
    toggleMenu: () => void,
    toggleDocumentation: () => void,
}

export function MenuIconsTask(props: MenuIconsTaskProps) {
    const showDocumentation = useAppSelector(selectShowDocumentation);
    const showFullScreen = useAppSelector(state => state.options.showFullScreen);
    const showMenu = useAppSelector(state => state.options.showMenu);
    const showHints = useAppSelector(state => selectAvailableHints(state).length > 0);
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);
    const screen = useAppSelector(state => state.screen);

    const dispatch = useDispatch();

    const toggleDocumentation = () => {
        if (fullScreenActive) {
            dispatch({type: ActionTypes.FullscreenLeave});
        }
        props.toggleDocumentation();
    }

    const toggleHints = () => {
        const newScreen = Screen.Hints === screen ? null : Screen.Hints;
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: newScreen}});
    };

    return (
        <div id='menu'>
            <div className="menu-task-elements">
                {showFullScreen && <div className="menu-task-element is-blue">
                    <FullscreenButton />
                </div>}
                {showDocumentation && <div className="menu-task-element is-blue">
                    <Button onClick={toggleDocumentation} icon='help'/>
                </div>}
                {showHints && <div className="menu-task-element is-blue">
                    <Button onClick={toggleHints} icon='lightbulb'/>
                </div>}
                {showMenu && <div className="menu-task-element">
                    <Button onClick={props.toggleMenu} icon='menu'/>
                </div>}
            </div>
        </div>
    );
}
