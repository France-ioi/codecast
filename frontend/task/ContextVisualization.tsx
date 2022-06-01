import React, {useEffect} from "react";
import {quickAlgoLibraries, QuickAlgoLibrariesActionType} from "./libs/quickalgo_libraries";
import {useAppSelector} from "../hooks";
import {useResizeDetector} from "react-resize-detector";
import {TaskTestsSelector} from "./TaskTestsSelector";
import {put} from "typed-redux-saga";
import {useDispatch} from "react-redux";

export function ContextVisualization() {
    const Visualization = quickAlgoLibraries.getVisualization();
    const currentTask = useAppSelector(state => state.task.currentTask);
    const currentLevel = useAppSelector(state => state.task.currentLevel);
    const taskLoaded = useAppSelector(state => state.task.loaded);
    const {width, height, ref} = useResizeDetector();
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const dispatch = useDispatch();

    const context = quickAlgoLibraries.getContext(null, 'main');

    useEffect(() => {
        if (context) {
            dispatch({type: QuickAlgoLibrariesActionType.QuickAlgoLibrariesRedrawDisplay});
        }
    }, [taskLoaded]);

    useEffect(() => {
        if (context) {
            context.updateScale();
        }
    }, [width, height]);

    let testsSelectorEnabled = false;
    if (currentTask && currentLevel) {
        const levelData = currentTask.data[currentLevel];
        testsSelectorEnabled = 1 < levelData.length;
    }

    return (
        <div className="context-visualization">
            <div className="task-visualization-container">
                <div className="task-visualization" ref={ref} style={{fontSize: `${zoomLevel}rem`}}>
                    {currentTask && currentTask.gridInfos && currentTask.gridInfos.images &&
                        currentTask.gridInfos.images.map((element, key) =>
                            <img id={element.id} key={key} src={element.path.default} style={{display: 'none'}}/>
                        )
                    }
                    {Visualization ? <Visualization/> : <div id="testSelector"><div id="grid"/></div>}
                </div>
            </div>

            {testsSelectorEnabled && <TaskTestsSelector/>}
        </div>
    );
}
