import React, {useEffect, useState} from 'react';
import {useDispatch} from "react-redux";
import {Container} from 'react-bootstrap';
import {taskLoad} from "../task";
import {useAppSelector} from "../hooks";
import {TaskSuccessDialog} from "../task/dialog/TaskSuccessDialog";
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
import {TralalereBox} from "./TralalereBox";
import {TralalereInstructions} from "./TralalereInstructions";
import {LayoutMobileMode, LayoutType} from "../task/layout/layout";
import {ActionTypes} from "../task/layout/actionTypes";
import {TralalereFooter} from "./TralalereFooter";
import {TralalereBlocksUsage} from "./TralalereBlocksUsage";
import {StepperStatus} from "../stepper";

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

    const windowWidth = useAppSelector(state => state.windowWidth);
    const availableHints = useAppSelector(state => state.hints.availableHints);
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
    }, [isMobile])

    useEffect(() => {
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
        <Container key={language} fluid className={`task ${fullScreenActive ? 'full-screen' : ''} layout-${layoutType} tralalere`}>
            <div className="layout-general">
                {LayoutType.MobileVertical === layoutType && <div className="tralalere-mobile-tabs">
                    <div className={`tralalere-mobile-tab ${LayoutMobileMode.Player === layoutMobileMode || LayoutMobileMode.EditorPlayer === layoutMobileMode ? 'is-active' : ''}`} onClick={() => selectMode(LayoutMobileMode.Player)}>
                    Représentation</div>
                    <div className={`tralalere-mobile-tab ${LayoutMobileMode.Editor === layoutMobileMode ? 'is-active' : ''}`} onClick={() => selectMode(LayoutMobileMode.Editor)}>
                    Coding
                    </div>
                </div>}

                <div className={`tralalere-section`}>
                    {(!isMobile || LayoutMobileMode.Editor === layoutMobileMode) && <div className={`tralalere-menu-icons ${menuHelpsOpen ? 'has-helps' : ''}`}>
                        {0 < availableHints.length && <div className="tralalere-button" onClick={toggleHints}>
                          ?
                            <div className="tralalere-menu-label">Indices</div>
                        </div>}

                        <div className="tralalere-button" onClick={toggleDocumentation}>
                            <img className="menu-task-icon" src={window.modulesPath + 'img/algorea/crane/documentation.svg'}/>
                            <div className="tralalere-menu-label">Documentation</div>
                        </div>
                    </div>}

                    {(!isMobile || LayoutMobileMode.Player === layoutMobileMode || LayoutMobileMode.EditorPlayer === layoutMobileMode) && <div className={`tralalere-visualization ${instructionsExpanded ? 'instructions-expanded' : ''}`} style={{backgroundImage: `url(${window.modulesPath + 'img/algorea/crane/visualization-background.png'}`}}>
                        {!isMobile &&
                          <React.Fragment>
                              <TralalereInstructions
                                  onExpand={expandInstructions}
                              />
                              {instructionsExpanded && <TralalereInstructions expanded onExpand={expandInstructions}/>}
                          </React.Fragment>
                        }

                        <ContextVisualization/>
                    </div>}
                    {(!isMobile || LayoutMobileMode.Editor === layoutMobileMode) && <div className="blockly-editor">
                        <LayoutEditor style={{backgroundImage: `url(${window.modulesPath + 'img/algorea/crane/editor-cross.png'}`}}/>

                        {CodecastPlatform.Blockly === platform && <div className="blockly-flyout-wrapper">
                            <img className="blockly-flyout-wrapper-bottom" src={window.modulesPath + 'img/algorea/crane/editor-bottom-background.png'}/>
                        </div>}

                        {isMobile && <TralalereBlocksUsage/>}
                        {isMobile && <div className="tralalere-editor-play">
                            <button className="tralalere-button" onClick={() => selectMode(LayoutMobileMode.EditorPlayer)}>
                                <FontAwesomeIcon icon={faPlay}/>
                            </button>
                        </div>}
                        {!isMobile && <TralalereFooter/>}
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

            <TaskSuccessDialog/>

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
