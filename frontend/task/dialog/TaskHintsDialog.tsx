import {Dialog} from "@blueprintjs/core";
import React from "react";
import {getMessage} from "../../lang";
import {TaskHints} from '../hints/TaskHints';
import {ActionTypes as CommonActionTypes} from '../../common/actionTypes';
import {Screen} from '../../common/screens';
import {useAppSelector} from '../../hooks';
import {useDispatch} from 'react-redux';

export function TaskHintsDialog() {
    const screen = useAppSelector(state => state.screen);
    const hintsOpen = Screen.Hints === screen;
    const dispatch = useDispatch();

    const closeHints = () => {
        dispatch({
            type: CommonActionTypes.AppSwitchToScreen,
            payload: {screen: null},
        });
    };

    return (
        <Dialog
            title={getMessage('TRALALERE_MENU_HINTS')}
            icon="lightbulb"
            className="hints-dialog"
            isOpen={hintsOpen}
            canOutsideClickClose={true}
            canEscapeKeyClose={true}
            onClose={closeHints}
        >
            <TaskHints
                askHintClassName="quickalgo-button"
            />
        </Dialog>
    );
}
