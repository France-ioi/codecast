import React from "react";
import {connect} from "react-redux";
import {AppStore, CodecastOptions} from "../../store";
import {createLayout, selectActiveView} from "./layout";
import {StepperStatus} from "../../stepper";
import {withResizeDetector} from 'react-resize-detector';
import {Directive} from "../../stepper/python/directives";
import {Screen} from "../../common/screens";
import {getNotionsBagFromIncludeBlocks} from '../blocks/notions';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {LayoutMobileMode, LayoutType} from './layout_types';
import {selectCurrentTest} from '../task_slice';

interface LayoutLoaderStateToProps {
    advisedVisualization: string,
    orderedDirectives: readonly Directive[],
    fullScreenActive: boolean,
    preferredVisualizations: string[],
    layoutType: LayoutType,
    layoutRequiredType: LayoutType,
    layoutMobileMode: LayoutMobileMode,
    screen: Screen,
    options: CodecastOptions,
    currentTask: any,
    showVariables: boolean,
    activeView?: string,
}

function mapStateToProps(state: AppStore): LayoutLoaderStateToProps {
    const fullScreenActive = state.fullscreen.active;
    const currentStepperState = state.stepper.currentStepperState;
    const orderedDirectives = currentStepperState && currentStepperState.directives ? currentStepperState.directives.ordered : [];
    const advisedVisualization = (!state.stepper || state.stepper.status === StepperStatus.Clear) && state.task.resetDone ? 'instructions' : 'variables';
    const preferredVisualizations = state.layout.preferredVisualizations;
    const layoutType = state.layout.type;
    const layoutRequiredType = state.layout.requiredType;
    const screen = state.screen;
    const options = state.options;
    const currentTask = state.task.currentTask;
    let showVariables = options.showStack;
    const activeView = selectActiveView(state);
    const currentTest = selectCurrentTest(state);
    const context = quickAlgoLibraries.getContext(null, 'main');

    if (null !== currentTask && context) {
        const notionsBag = getNotionsBagFromIncludeBlocks(state.task.contextIncludeBlocks, context.getNotionsList());
        showVariables = showVariables && context.usesStack() && notionsBag.hasNotion('variables_set') && !currentTest?.data?.hiddenProgression;
    }

    let layoutMobileMode = state.layout.mobileMode;
    if (LayoutMobileMode.Instructions === layoutMobileMode && !currentTask) {
        layoutMobileMode = LayoutMobileMode.Editor;
    }

    return {
        orderedDirectives, fullScreenActive, advisedVisualization, preferredVisualizations,
        layoutType, layoutMobileMode, screen, options, currentTask, layoutRequiredType,
        showVariables, activeView,
    };
}

interface LayoutLoaderDispatchToProps {
    dispatch: Function
}

interface LayoutLoaderProps extends LayoutLoaderStateToProps, LayoutLoaderDispatchToProps {
    width: number,
    height: number,
}

class _LayoutLoader extends React.PureComponent<LayoutLoaderProps> {
    render() {
        if (undefined !== this.props.width && undefined !== this.props.height) {
            return createLayout(this.props);
        }

        return (
            <div className="layout-empty"/>
        );
    }
}

// We need to manually check if directives are the same because the current stepper state is rewritten
// at each stepper execution step
function areEqual(prevProps, nextProps) {
    if (Object.keys(prevProps).length !== Object.keys(nextProps).length) {
        return false;
    }

    for (let key of Object.keys(prevProps)) {
        if ('orderedDirectives' === key) {
            if (JSON.stringify(prevProps.orderedDirectives) !== JSON.stringify(nextProps.orderedDirectives)) {
                return false;
            }
        } else if ('width' === key || 'height' === key) {
            if (prevProps[key] !== nextProps[key] && nextProps[key] !== 0) {
                return false;
            }
        } else {
            if (prevProps[key] !== nextProps[key]) {
                return false;
            }
        }
    }

    return true;
}

export const LayoutLoader = connect(mapStateToProps)(withResizeDetector(React.memo(_LayoutLoader, areEqual)));
