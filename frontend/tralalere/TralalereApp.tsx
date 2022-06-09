import React, {useEffect} from 'react';
import {useDispatch} from "react-redux";
import {Container} from 'react-bootstrap';
import {taskLoad} from "../task";
import {useAppSelector} from "../hooks";
import {TaskSuccessDialog} from "../task/dialog/TaskSuccessDialog";
import {TaskLevelName} from "../task/platform/platform_slice";
import {PromptModalDialog} from "../task/dialog/PromptModalDialog";
import {TaskInstructions} from "../task/TaskInstructions";
import {ContextVisualization} from "../task/ContextVisualization";
import {LayoutEditor} from "../task/layout/LayoutEditor";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {Screen} from "../common/screens";

export function TralalereApp() {
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);
    const options = useAppSelector(state => state.options);
    const layoutType = useAppSelector(state => state.layout.type);
    const language = useAppSelector(state => state.options.language);
    const screen = useAppSelector(state => state.screen);

    const dispatch = useDispatch();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'tralalere');

        setTimeout(() => {
            const taskLoadParameters: {level?: TaskLevelName} = {};
            if (options.level) {
                taskLoadParameters.level = options.level;
            }

            dispatch(taskLoad(taskLoadParameters));
        });
    }, []);

    const toggleDocumentation = () => {
        const newScreen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen ? null : Screen.DocumentationSmall;
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: newScreen}});
    };

    return (
        <Container key={language} fluid className={`task ${fullScreenActive ? 'full-screen' : ''} layout-${layoutType} tralalere`}>
            <div className="layout-general">
                <div className="tralalere-instructions">
                    <img className="tralalere-instructions-window" src={require('./images/instructions-window.png').default}/>
                    <div className="tralalere-instructions-around-left"/>
                    <img className="tralalere-instructions-left" src={require('./images/instructions-left-folded.png').default}/>
                    <div className="tralalere-instructions-container">
                        <TaskInstructions/>
                    </div>
                </div>

                <div className="tralalere-menu-icons">
                    <div className="menu-task-element" onClick={toggleDocumentation}>
                        <img className="menu-task-icon" src={require('./images/documentation.svg').default}/>
                    </div>
                </div>

                <div className={`tralalere-section`}>
                    <div className="tralalere-visualization" style={{backgroundImage: `url(${require('./images/visualization-background.png').default}`}}>
                        <ContextVisualization/>
                    </div>
                    <div className="blockly-editor">
                        <LayoutEditor/>
                    </div>
                </div>
            </div>

            <TaskSuccessDialog/>

            <PromptModalDialog/>
        </Container>
    );
}
