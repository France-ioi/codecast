import React, {useCallback, useRef} from "react";
import {shallowEqual, useSelector} from "react-redux";
import {AppStore} from "../../store";
import {createLayout, LayoutProps, selectActiveView, selectLayoutMobileMode} from "./layout";
import {StepperStatus} from "../../stepper";
import {useResizeDetector} from 'react-resize-detector';
import {getNotionsBagFromIncludeBlocks} from '../blocks/notions';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {selectCurrentTest} from '../task_slice';

function selectLayoutLoaderProps(state: AppStore) {
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
    const layoutMobileMode = selectLayoutMobileMode(state);

    if (null !== currentTask && context) {
        const notionsBag = getNotionsBagFromIncludeBlocks(state.task.contextIncludeBlocks, context.getNotionsList());
        showVariables = showVariables && context.usesStack() && notionsBag.hasNotion('variables_set') && !currentTest?.data?.hiddenProgression;
    }

    return {
        orderedDirectives, fullScreenActive, advisedVisualization, preferredVisualizations,
        layoutType, layoutMobileMode, screen, options, currentTask, layoutRequiredType,
        showVariables, activeView,
    };
}

// We need to manually check if directives are the same because the current stepper state is rewritten
// at each stepper execution step
function areEqual(prevProps: LayoutProps, nextProps: LayoutProps) {
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

const LayoutLoaderContent = React.memo(function LayoutLoaderContent(props: LayoutProps) {
    if (undefined !== props.width && undefined !== props.height) {
        return createLayout(props);
    }

    return (
        <div className="layout-empty"/>
    );
}, areEqual);

export function LayoutLoader() {
    const stateProps = useSelector(selectLayoutLoaderProps, shallowEqual);
    const parentRef = useRef<HTMLElement>(null);
    const {width, height} = useResizeDetector({targetRef: parentRef});

    const captureParent = useCallback((node: HTMLElement | null) => {
        if (node) {
            parentRef.current = node.parentElement;
        }
    }, []);

    if (undefined !== width && undefined !== height) {
        return <LayoutLoaderContent {...stateProps} width={width} height={height}/>;
    }

    return <div ref={captureParent} className="layout-empty"/>;
}
