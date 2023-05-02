import {TralalereBox} from "./TralalereBox";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {TaskHints} from "../task/hints/TaskHints";
import {Dialog, Icon} from "@blueprintjs/core";
import {TralalereControls} from "./TralalereControls";
import React from "react";
import {stepperClearError} from "../stepper/actionTypes";
import {Screen} from "../common/screens";
import {useDispatch} from "react-redux";
import {toHtml} from "../utils/sanitize";
import {useAppSelector} from "../hooks";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {LayoutType} from "../task/layout/layout";
import {getMessage} from '../lang';
import {LibraryTestResult} from '../task/libs/library_test_result';
import {nl2br} from '../common/utils';
import {TaskTestsSubmissionResultOverview} from '../submission/TaskTestsSubmissionResultOverview';

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
        if (stepperError instanceof LibraryTestResult) {
            if (!stepperError.type) {
                const stepperErrorHtml = toHtml(nl2br(stepperError.message));
                error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
            } else if ('task-tests-submission-results-overview' === stepperError.type) {
                error = <TaskTestsSubmissionResultOverview {...stepperError.props}/>;
            } else if ('compilation' === stepperError.type) {
                const stepperErrorHtml = toHtml(stepperError.props.content);
                error = <div dangerouslySetInnerHTML={stepperErrorHtml} className="compilation"/>;
            } else if (stepperError.message) {
                const stepperErrorHtml = toHtml(nl2br(stepperError.message));
                error = <div dangerouslySetInnerHTML={stepperErrorHtml}/>;
            } else {
                // We only show the result of an execution
                hasError = false;
            }
        } else {
            const stepperErrorHtml = toHtml(nl2br(stepperError));
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
            <Dialog isOpen={hintsOpen} className={`simple-dialog tralalere-hints ${isMobile ? 'is-mobile' : ''}`} canOutsideClickClose={true} canEscapeKeyClose={true} onClose={closeHints}>
                <TralalereBox>
                    <div className="tralalere-box-header">
                        <div className="tralalere-box-header-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" className="svg-inline--fa fa-w-14"><path fill="currentColor" d="M176 80c-52.94 0-96 43.06-96 96 0 8.84 7.16 16 16 16s16-7.16 16-16c0-35.3 28.72-64 64-64 8.84 0 16-7.16 16-16s-7.16-16-16-16zM96.06 459.17c0 3.15.93 6.22 2.68 8.84l24.51 36.84c2.97 4.46 7.97 7.14 13.32 7.14h78.85c5.36 0 10.36-2.68 13.32-7.14l24.51-36.84c1.74-2.62 2.67-5.7 2.68-8.84l.05-43.18H96.02l.04 43.18zM176 0C73.72 0 0 82.97 0 176c0 44.37 16.45 84.85 43.56 115.78 16.64 18.99 42.74 58.8 52.42 92.16v.06h48v-.12c-.01-4.77-.72-9.51-2.15-14.07-5.59-17.81-22.82-64.77-62.17-109.67-20.54-23.43-31.52-53.15-31.61-84.14-.2-73.64 59.67-128 127.95-128 70.58 0 128 57.42 128 128 0 30.97-11.24 60.85-31.65 84.14-39.11 44.61-56.42 91.47-62.1 109.46a47.507 47.507 0 0 0-2.22 14.3v.1h48v-.05c9.68-33.37 35.78-73.18 52.42-92.16C335.55 260.85 352 220.37 352 176 352 78.8 273.2 0 176 0z"/></svg>
                        </div>
                        <div className="tralalere-box-header-title">
                            {getMessage('TRALALERE_HINTS_TITLE')}
                        </div>
                        <div className="tralalere-box-header-close">
                            <div className="tralalere-button" onClick={closeHints}>
                                <FontAwesomeIcon icon={faTimes}/>
                            </div>
                        </div>
                    </div>
                    <TaskHints
                        askHintClassName="tralalere-button"
                    />
                </TralalereBox>
            </Dialog>

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
