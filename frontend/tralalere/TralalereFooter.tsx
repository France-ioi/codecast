import {TralalereBox} from "./TralalereBox";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {TaskHints} from "../task/hints/TaskHints";
import {Icon} from "@blueprintjs/core";
import {TralalereControls} from "./TralalereControls";
import React from "react";
import {stepperClearError} from "../stepper/actionTypes";
import {Screen} from "../common/screens";
import {useDispatch} from "react-redux";
import {toHtml} from "../utils/sanitize";
import {useAppSelector} from "../hooks";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {LayoutType} from "../task/layout/layout";

export interface TralalereFooterProps {
    instructionsExpanded?: boolean,
    expandInstructions?: () => void,
    withoutControls?: boolean,
}

export function TralalereFooter (props: TralalereFooterProps) {
    const stepperError = useAppSelector(state => state.stepper.error);
    const screen = useAppSelector(state => state.screen);
    const hintsOpen = Screen.Hints === screen;
    const layoutType = useAppSelector(state => state.layout.type);
    const isMobile = (LayoutType.MobileHorizontal === layoutType || LayoutType.MobileVertical === layoutType);
    const blocksUsage = useAppSelector(state => state.task.blocksUsage);
    let hasError = !!stepperError;
    let errorClosable = true;

    const dispatch = useDispatch();

    let error = null;
    if (hasError) {
        if ('compilation' === stepperError.type) {
            const stepperErrorHtml = toHtml(stepperError.content);
            error = <div dangerouslySetInnerHTML={stepperErrorHtml} className="compilation"/>;
        } else {
            const stepperErrorHtml = toHtml(stepperError);
            error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
        }
    } else if (blocksUsage && blocksUsage.error) {
        hasError = true;
        errorClosable = false;
        error = <div dangerouslySetInnerHTML={toHtml(blocksUsage.error)}/>;
    }

    const onClearError = () => {
        if (errorClosable) {
            dispatch(stepperClearError());
        }
    };

    const closeHints = () => {
        dispatch({
            type: CommonActionTypes.AppSwitchToScreen,
            payload: {screen: null},
        });
    };

    const expandInstructions = () => {
        if (props.expandInstructions) {
            props.expandInstructions();
        }
    };

    return (
        <div>
            {hintsOpen && <div className="tralalere-hints">
                <TralalereBox>
                    <div className="tralalere-box-header">
                        <div className="tralalere-box-header-icon">
                    ?
                        </div>
                        <div className="tralalere-box-header-title">
                    Indice
                        </div>
                        <div className="tralalere-box-header-close">
                            <div className="tralalere-button" onClick={closeHints}>
                                <FontAwesomeIcon icon={faTimes}/>
                            </div>
                        </div>
                    </div>
                    <TaskHints/>
                </TralalereBox>
            </div>}
            {!props.withoutControls && <React.Fragment>
                <div className="tralalere-controls">
                    <div>
                        {hasError && <div className={`error-message ${errorClosable ? 'is-closable' : ''}`} onClick={onClearError}>
                            {errorClosable && <button type="button" className="close-button" onClick={onClearError}>
                                <Icon icon="cross"/>
                            </button>}
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
                {isMobile && !props.instructionsExpanded && <div className="tralalere-instructions-icon">
                    <div className="tralalere-button" onClick={expandInstructions}>
                        +
                    </div>
                </div>}
            </React.Fragment>}
        </div>
    )
}