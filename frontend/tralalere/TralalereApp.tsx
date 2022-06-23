import React, {useEffect, useState} from 'react';
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
import {TralalereControls} from "./TralalereControls";
import {Dialog, Icon} from "@blueprintjs/core";
import {toHtml} from "../utils/sanitize";
import {stepperClearError} from "../stepper/actionTypes";
import {Documentation} from "../task/documentation/Documentation";
import {CodecastPlatform} from "../store";
import {TaskHints} from "../task/hints/TaskHints";


export function TralalereApp() {
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);
    const options = useAppSelector(state => state.options);
    const layoutType = useAppSelector(state => state.layout.type);
    const language = useAppSelector(state => state.options.language);
    const platform = useAppSelector(state => state.options.platform);
    const screen = useAppSelector(state => state.screen);
    const [instructionsExpanded, setInstructionsExpanded] = useState(false);
    const contextId = useAppSelector(state => state.task.contextId);

    const documentationOpen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen;
    const hintsOpen = Screen.Hints === screen;
    const stepperError = useAppSelector(state => state.stepper.error);
    const hasError = !!stepperError;
    const windowWidth = useAppSelector(state => state.windowWidth);
    const availableHints = useAppSelector(state => state.hints.availableHints);

    let error = null;
    if (hasError) {
        if ('compilation' === stepperError.type) {
            const stepperErrorHtml = toHtml(stepperError.content);
            error = <div dangerouslySetInnerHTML={stepperErrorHtml} className="compilation"/>;
        } else {
            const stepperErrorHtml = toHtml(stepperError);
            error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
        }
    }

    const dispatch = useDispatch();

    useEffect(() => {
        window.app = 'tralalere';
        document.documentElement.setAttribute('data-theme', 'tralalere');

        setTimeout(() => {
            const taskLoadParameters: {level?: TaskLevelName} = {};
            if (options.level) {
                taskLoadParameters.level = options.level;
            }

            dispatch(taskLoad(taskLoadParameters));
        });
    }, []);

    useEffect(() => {
        const flyout = document.getElementsByClassName('blocklyFlyout');
        if (flyout.length && (flyout[0] as SVGGraphicsElement).getBBox()) {
            const width = (flyout[0] as SVGGraphicsElement).getBBox().width;
            document.documentElement.style.setProperty('--flyout-width', width + 'px');
        } else {
            document.documentElement.style.setProperty('--flyout-width', '0px');
        }
    }, [contextId, windowWidth]);

    const toggleDocumentation = () => {
        const newScreen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen ? null : Screen.DocumentationSmall;
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: newScreen}});
    };

    const toggleHints = () => {
        const newScreen = Screen.Hints === screen ? null : Screen.Hints;
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: newScreen}});
    };

    const expandInstructions = () => {
        setInstructionsExpanded(!instructionsExpanded);
    };

    const onClearError = () => {
        dispatch(stepperClearError());
    };

    const closeDocumentation = () => {
        dispatch({
            type: CommonActionTypes.AppSwitchToScreen,
            payload: {screen: null},
        });
    };

    return (
        <Container key={language} fluid className={`task ${fullScreenActive ? 'full-screen' : ''} layout-${layoutType} tralalere`}>
            <div className="layout-general">
                <div className="tralalere-menu-icons">
                    {0 < availableHints.length && <div className="tralalere-button" onClick={toggleHints}>
                        ?
                    </div>}

                    <div className="tralalere-button" onClick={toggleDocumentation}>
                        <img className="menu-task-icon" src={require('./images/documentation.svg').default}/>
                    </div>
                </div>

                <div className={`tralalere-section`}>
                    <div className="tralalere-visualization" style={{backgroundImage: `url(${require('./images/visualization-background.png').default}`}}>
                        <div className="tralalere-instructions">
                            {instructionsExpanded ?
                                <img className="tralalere-instructions-shadow-down"
                                    src={require('./images/instructions-shadow-down.png').default}/>
                                :
                                <img className="tralalere-instructions-shadow-right"
                                    src={require('./images/instructions-shadow-right.png').default}/>
                            }

                            <img className="tralalere-instructions-window" src={require('./images/instructions-window.png').default}/>
                            {!instructionsExpanded && <div className="tralalere-instructions-around-left"/>}
                            <img className="tralalere-instructions-left" src={require('./images/instructions-left-folded.png').default}/>
                            <div className={`tralalere-instructions-container ${!instructionsExpanded ? 'is-limited' : ''}`}>
                                <TaskInstructions/>

                                <div>
                                    <div className="tralalere-button" onClick={expandInstructions}>
                                        {instructionsExpanded ? '-' : '+'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ContextVisualization/>
                    </div>
                    <div className="blockly-editor">
                        <LayoutEditor style={{backgroundImage: `url(${require('./images/editor-cross.png').default}`}}/>
                        {CodecastPlatform.Blockly === platform && <div className="blockly-flyout-wrapper">
                            <img className="blockly-flyout-wrapper-bottom" src={require('./images/editor-bottom-background.png').default}/>
                        </div>}
                        {hintsOpen && <div className="tralalere-hints">
                            <TaskHints/>
                        </div>}
                        <div className="tralalere-controls">
                            <div>
                                {hasError && <div className="error-message" onClick={onClearError}>
                                    <button type="button" className="close-button" onClick={onClearError}>
                                        <Icon icon="cross"/>
                                    </button>
                                    <div className="error-message-wrapper">
                                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M19.8304 0.192383H8.46988L0.429688 8.23257V19.5931L8.46988 27.6333H19.8304L27.8706 19.5931V8.23257L19.8304 0.192383ZM11.0044 8.82642C10.4686 8.29061 9.59988 8.29061 9.06406 8.82642C8.52825 9.36224 8.52825 10.231 9.06406 10.7668L12.21 13.9127L9.06406 17.0587C8.52825 17.5945 8.52825 18.4632 9.06406 18.9991C9.59988 19.5349 10.4686 19.5349 11.0044 18.9991L14.1504 15.8531L17.2963 18.9991C17.8322 19.5349 18.7009 19.5349 19.2367 18.9991C19.7725 18.4632 19.7725 17.5945 19.2367 17.0587L16.0908 13.9127L19.2367 10.7668C19.7725 10.231 19.7725 9.36224 19.2367 8.82642C18.7009 8.29061 17.8322 8.29061 17.2963 8.82642L14.1504 11.9724L11.0044 8.82642Z" fill="#FF3C11"/>
                                        </svg>
                                        <div className="message">
                                            {error}
                                        </div>
                                    </div>
                                </div>}

                                <TralalereControls enabled={true}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <TaskSuccessDialog/>

            <PromptModalDialog/>

            <Dialog isOpen={documentationOpen} className="simple-dialog" canOutsideClickClose={true} canEscapeKeyClose={true} onClose={closeDocumentation}>
                <Documentation standalone={false}/>
            </Dialog>
        </Container>
    );
}
