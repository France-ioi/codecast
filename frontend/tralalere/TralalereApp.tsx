import React, {useEffect, useState} from 'react';
import {useDispatch} from "react-redux";
import {Container} from 'react-bootstrap';
import {taskLoad} from "../task";
import {useAppSelector} from "../hooks";
import {TaskLevelName} from "../task/platform/platform_slice";
import {PromptModalDialog} from "../task/dialog/PromptModalDialog";
import {ContextVisualization} from "../task/ContextVisualization";
import {LayoutEditor} from "../task/layout/LayoutEditor";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {Screen} from "../common/screens";
import {Dialog} from "@blueprintjs/core";
import {Documentation} from "../task/documentation/Documentation";
import {CodecastPlatform} from "../store";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlay, faTimes} from "@fortawesome/free-solid-svg-icons";
import {faLightbulb} from "@fortawesome/free-regular-svg-icons";
import {TralalereBox} from "./TralalereBox";
import {TralalereInstructions} from "./TralalereInstructions";
import {LayoutMobileMode, LayoutType} from "../task/layout/layout";
import {ActionTypes} from "../task/layout/actionTypes";
import {TralalereFooter} from "./TralalereFooter";
import {TralalereBlocksUsage} from "./TralalereBlocksUsage";
import {StepperStatus} from "../stepper";
import {selectAnswer} from "../task/selectors";
import {taskSuccessClear} from "../task/task_slice";
import {hasBlockPlatform} from "../stepper/js";

export function TralalereApp() {
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);
    const options = useAppSelector(state => state.options);
    const layoutType = useAppSelector(state => state.layout.type);
    let layoutMobileMode = useAppSelector(state => state.layout.mobileMode);
    const language = useAppSelector(state => state.options.language);
    const platform = useAppSelector(state => state.options.platform);
    const screen = useAppSelector(state => state.screen);
    const [instructionsExpanded, setInstructionsExpanded] = useState(true);
    const contextId = useAppSelector(state => state.task.contextId);
    const menuHelpsOpen = useAppSelector(state => state.task.menuHelpsOpen);
    const isMobile = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);
    const documentationOpen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen;
    const programRunning = useAppSelector(state => state.stepper && state.stepper.status !== StepperStatus.Clear);
    if (programRunning && isMobile && LayoutMobileMode.EditorPlayer !== layoutMobileMode) {
        layoutMobileMode = LayoutMobileMode.EditorPlayer;
    }
    const taskLoaded = useAppSelector(state => state.task.loaded);

    const windowWidth = useAppSelector(state => state.windowWidth);
    const availableHints = useAppSelector(state => state.hints.availableHints);
    const answer = useAppSelector(state => selectAnswer(state));
    const compileStatus = useAppSelector(state => state.compile.status);
    const taskSuccess = useAppSelector(state => state.task.success);

    // const availableHints = [
    //     {content: 'aazazaz'},
    //     {content: 'aazazazazazazz'},
    // ];

    const dispatch = useDispatch();

    useEffect(() => {
        window.app = 'tralalere';
        document.documentElement.setAttribute('data-theme', 'tralalere');
        selectMode(LayoutMobileMode.Player);

        setTimeout(() => {
            const taskLoadParameters: {level?: TaskLevelName} = {};
            if (options.level) {
                taskLoadParameters.level = options.level;
            }

            dispatch(taskLoad(taskLoadParameters));
        });
    }, []);

    useEffect(() => {
        if (isMobile) {
            setInstructionsExpanded(false);
        }
    }, [isMobile]);

    useEffect(() => {
        if (taskLoaded) {
            setInstructionsExpanded(false);
            if (taskSuccess) {
                dispatch(taskSuccessClear({}));
            }
        }
    }, [answer, compileStatus]);

    useEffect(() => {
        // Set timeout to give time to Blockly editor to load before
        setTimeout(() => {
            const flyoutToolbox = document.getElementsByClassName('blocklyToolboxDiv');
            const flyout = document.getElementsByClassName('blocklyFlyout');
            if (flyoutToolbox.length && (flyoutToolbox[0] as HTMLElement).clientWidth) {
                const width = (flyoutToolbox[0] as HTMLElement).clientWidth;
                document.documentElement.style.setProperty('--flyout-width', width + 'px');
            } else if (flyout.length && (flyout[0] as SVGGraphicsElement).getBBox()) {
                const width = (flyout[0] as SVGGraphicsElement).getBBox().width;
                document.documentElement.style.setProperty('--flyout-width', width + 'px');
            } else {
                document.documentElement.style.setProperty('--flyout-width', '0px');
            }
        });
    }, [contextId, windowWidth, layoutMobileMode]);

    const toggleDocumentation = () => {
        const newScreen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen ? null : Screen.DocumentationBig;
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: newScreen}});
    };

    const toggleHints = () => {
        const newScreen = Screen.Hints === screen ? null : Screen.Hints;
        dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: newScreen}});
    };

    const expandInstructions = () => {
        setInstructionsExpanded(!instructionsExpanded);
    };

    const closeDocumentation = () => {
        dispatch({
            type: CommonActionTypes.AppSwitchToScreen,
            payload: {screen: null},
        });
    };

    const selectMode = (mobileMode: LayoutMobileMode) => {
        dispatch({type: ActionTypes.LayoutMobileModeChanged, payload: {mobileMode}});
    };

    return (
        <Container key={language} fluid className={`task ${fullScreenActive ? 'full-screen' : ''} layout-${layoutType} tralalere platform-${options.platform}`}>
            <div className="layout-general">
                {isMobile && <div className="tralalere-mobile-tabs">
                    <div className={`tralalere-mobile-tab ${LayoutMobileMode.Player === layoutMobileMode || LayoutMobileMode.EditorPlayer === layoutMobileMode ? 'is-active' : ''}`} onClick={() => selectMode(LayoutMobileMode.Player)}>
                    Représentation</div>
                    <div className={`tralalere-mobile-tab ${LayoutMobileMode.Editor === layoutMobileMode ? 'is-active' : ''}`} onClick={() => selectMode(LayoutMobileMode.Editor)}>
                    Coding
                    </div>
                </div>}

                <div className={`tralalere-section`}>
                    {(!isMobile || LayoutMobileMode.Editor === layoutMobileMode) && <div className={`tralalere-menu-icons ${menuHelpsOpen ? 'has-helps' : ''}`}>
                        <div className="tralalere-button" onClick={toggleDocumentation}>
                            <img className="menu-task-icon" src={window.modulesPath + 'img/algorea/crane/documentation.svg'}/>
                            <div className="tralalere-menu-label">Documentation</div>
                        </div>

                        {0 < availableHints.length && <div className="tralalere-button" onClick={toggleHints}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" className="svg-inline--fa fa-w-14"><path fill="currentColor" d="M176 80c-52.94 0-96 43.06-96 96 0 8.84 7.16 16 16 16s16-7.16 16-16c0-35.3 28.72-64 64-64 8.84 0 16-7.16 16-16s-7.16-16-16-16zM96.06 459.17c0 3.15.93 6.22 2.68 8.84l24.51 36.84c2.97 4.46 7.97 7.14 13.32 7.14h78.85c5.36 0 10.36-2.68 13.32-7.14l24.51-36.84c1.74-2.62 2.67-5.7 2.68-8.84l.05-43.18H96.02l.04 43.18zM176 0C73.72 0 0 82.97 0 176c0 44.37 16.45 84.85 43.56 115.78 16.64 18.99 42.74 58.8 52.42 92.16v.06h48v-.12c-.01-4.77-.72-9.51-2.15-14.07-5.59-17.81-22.82-64.77-62.17-109.67-20.54-23.43-31.52-53.15-31.61-84.14-.2-73.64 59.67-128 127.95-128 70.58 0 128 57.42 128 128 0 30.97-11.24 60.85-31.65 84.14-39.11 44.61-56.42 91.47-62.1 109.46a47.507 47.507 0 0 0-2.22 14.3v.1h48v-.05c9.68-33.37 35.78-73.18 52.42-92.16C335.55 260.85 352 220.37 352 176 352 78.8 273.2 0 176 0z"/></svg>
                            <div className="tralalere-menu-label">Indices</div>
                        </div>}
                    </div>}

                    {(!isMobile || LayoutMobileMode.Player === layoutMobileMode || LayoutMobileMode.EditorPlayer === layoutMobileMode) && <div className={`tralalere-visualization ${instructionsExpanded ? 'instructions-expanded' : ''}`} style={{backgroundImage: `url(${window.modulesPath + 'img/algorea/crane/visualization-background.png'}`}}>
                        {taskSuccess && <div className="tralalere-success">
                            <img className="tralalere-success-left"
                                src={window.modulesPath + 'img/algorea/crane/task-success.png'}/>
                            <div>Mission réussie</div>
                        </div>}

                        {!isMobile &&
                          <div className={taskSuccess ? 'visibility-hidden' : ''}>
                              <TralalereInstructions
                                  onExpand={expandInstructions}
                              />
                              {instructionsExpanded && <TralalereInstructions expanded onExpand={expandInstructions}/>}
                          </div>
                        }

                        <ContextVisualization/>
                    </div>}
                    {(!isMobile || LayoutMobileMode.Editor === layoutMobileMode) && <div className="blockly-editor">
                        <LayoutEditor style={{backgroundImage: `url(${window.modulesPath + 'img/algorea/crane/editor-cross.png'}`}}/>

                        {hasBlockPlatform(platform) && <div className="blockly-flyout-wrapper">
                            <img className="blockly-flyout-wrapper-bottom" src={window.modulesPath + 'img/algorea/crane/editor-bottom-background.png'}/>
                        </div>}

                        {isMobile && <TralalereBlocksUsage/>}
                        {isMobile && <div className="tralalere-editor-play">
                            <button className="tralalere-button" onClick={() => selectMode(LayoutMobileMode.EditorPlayer)}>
                                <FontAwesomeIcon icon={faPlay}/>
                            </button>
                        </div>}
                        <TralalereFooter
                            withoutControls={isMobile}
                        />
                    </div>}
                </div>

                {isMobile && LayoutMobileMode.EditorPlayer === layoutMobileMode && <div className="tralalere-section tralalere-coding-overlay">
                    <div className="blockly-editor">
                        <LayoutEditor/>
                    </div>
                </div>}

                {isMobile && instructionsExpanded &&
                    <TralalereInstructions
                        expanded
                        onExpand={expandInstructions}
                    />
                }

                {isMobile && (LayoutMobileMode.Player === layoutMobileMode || LayoutMobileMode.EditorPlayer === layoutMobileMode) && <TralalereFooter
                    instructionsExpanded={instructionsExpanded}
                    expandInstructions={expandInstructions}
                />}
            </div>

            <PromptModalDialog/>

            <Dialog isOpen={documentationOpen} className={`simple-dialog tralalere-doc ${isMobile ? 'is-mobile' : ''}`} canOutsideClickClose={true} canEscapeKeyClose={true} onClose={closeDocumentation}>
                <TralalereBox>
                    <Documentation
                        standalone={false}
                        hasTaskInstructions={false}
                        header={
                            <div className="tralalere-box-header">
                                <div className="tralalere-box-header-icon">
                                    <img className="menu-task-icon" src={window.modulesPath + 'img/algorea/crane/documentation_white.svg'}/>
                                </div>
                                <div className="tralalere-box-header-title">
                                    Documentation
                                </div>
                                <div className="tralalere-box-header-close">
                                    <div className="tralalere-button" onClick={closeDocumentation}>
                                        <FontAwesomeIcon icon={faTimes}/>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </TralalereBox>
            </Dialog>
        </Container>
    );
}
