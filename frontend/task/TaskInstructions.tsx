import React, {useEffect, useState} from "react";
import {useAppSelector} from "../hooks";
import {toHtml} from "../utils/sanitize";
import {quickAlgoLibraries} from "./libs/quickalgo_libraries";

export function TaskInstructions() {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const contextId = useAppSelector(state => state.task.contextId);
    const taskInstructionsHtmlFromOptions = useAppSelector(state => state.options.taskInstructions);
    const [algoreaInstructionsHtml, setAlgoreaInstructionsHtml] = useState(null);

    useEffect(() => {
        const context = quickAlgoLibraries.getContext(null, 'main');
        if (context && window.algoreaInstructionsStrings && window.getAlgoreaInstructionsAsHtml && currentTask.gridInfos.intro) {
            const strLang = window.stringsLanguage;
            const strings = window.algoreaInstructionsStrings[strLang];
            let newInstructions = window.getAlgoreaInstructionsAsHtml(strings, currentTask.gridInfos, currentTask.data, taskLevel);
            setAlgoreaInstructionsHtml(newInstructions);
        }
    }, [contextId]);

    let instructionsHtml = algoreaInstructionsHtml ? algoreaInstructionsHtml : taskInstructionsHtmlFromOptions;

    let taskInstructions = instructionsHtml ? (<div dangerouslySetInnerHTML={toHtml(instructionsHtml)}/>) : (
        <React.Fragment>
            <p>
                Programmez le robot pour qu'il pousse les caisses sur les cases marquées.
            </p>
            <p>
                Pour pousser une caisse, mettez d'abord le robot face à la caisse, il avancera en la poussant.
            </p>
            <p className="short">
                <strong>Attention :</strong> vous ne pouvez utiliser qu'une fois l'instruction "pousser la caisse".
            </p>
            <p className="long">
                Plus de détails sur la mission
            </p>
            <p className="long">
                Plus de détails sur la mission
            </p>
            <p className="long">
                Plus de détails sur la mission
            </p>
            <p className="long">
                Plus de détails sur la mission
            </p>
        </React.Fragment>
    );

    if (!instructionsHtml) {
        return null;
    }

    return (
        <div className={`task-mission level-${taskLevel}`} style={{fontSize: `${zoomLevel}rem`}}>
            <h1>Votre mission</h1>

            {taskInstructions}
        </div>
    );
}

TaskInstructions.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
