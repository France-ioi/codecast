import React, {useCallback, useRef} from "react";
import {useSelector} from "react-redux";
import {createSelector} from "@reduxjs/toolkit";
import {AppStore} from "../../store";
import {createLayout, LayoutProps, selectActiveView, selectLayoutMobileMode} from "./layout";
import {StepperStatus} from "../../stepper";
import {useResizeDetector} from 'react-resize-detector';
import {getNotionsBagFromIncludeBlocks} from '../blocks/notions';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {selectCurrentTest} from '../task_slice';

const selectLayoutLoaderProps = createSelector(
    [
        (state: AppStore) => state.fullscreen.active,
        (state: AppStore) => state.stepper.currentStepperState,
        (state: AppStore) => state.stepper?.status,
        (state: AppStore) => state.task.resetDone,
        (state: AppStore) => state.layout.preferredVisualizations,
        (state: AppStore) => state.layout.type,
        (state: AppStore) => state.layout.requiredType,
        (state: AppStore) => state.screen,
        (state: AppStore) => state.options,
        (state: AppStore) => state.task.currentTask,
        (state: AppStore) => state.task.contextIncludeBlocks,
        selectActiveView,
        selectCurrentTest,
        selectLayoutMobileMode,
    ],
    (...args) => {
        const [fullScreenActive, currentStepperState, stepperStatus, resetDone, preferredVisualizations,
            layoutType, layoutRequiredType, screen, options, currentTask, contextIncludeBlocks,
            activeView, currentTest, layoutMobileMode] = args;
        const orderedDirectives = currentStepperState && currentStepperState.directives ? currentStepperState.directives.ordered : [];
        const advisedVisualization = (stepperStatus === undefined || stepperStatus === StepperStatus.Clear) && resetDone ? 'instructions' : 'variables';
        let showVariables = options.showStack;
        const context = quickAlgoLibraries.getContext(null, 'main');

        if (null !== currentTask && context) {
            const notionsBag = getNotionsBagFromIncludeBlocks(contextIncludeBlocks, context.getNotionsList());
            showVariables = showVariables && context.usesStack() && notionsBag.hasNotion('variables_set') && !currentTest?.data?.hiddenProgression;
        }

        return {
            orderedDirectives, fullScreenActive, advisedVisualization, preferredVisualizations,
            layoutType, layoutMobileMode, screen, options, currentTask, layoutRequiredType,
            showVariables, activeView,
        };
    },
);

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
    const stateProps = useSelector(selectLayoutLoaderProps);
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
