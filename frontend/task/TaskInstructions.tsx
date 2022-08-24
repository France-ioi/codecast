import React, {ReactElement, useEffect, useRef, useState} from "react";
import {useAppSelector} from "../hooks";
import {toHtml} from "../utils/sanitize";
import {quickAlgoLibraries} from "./libs/quickalgo_libraries";
import {platformsList} from "../store";
import {taskLevelsList} from "./platform/platform_slice";

export interface TaskInstructionsProps {
    changeDisplayShowMore?: (display: boolean) => void,
    missionRightSlot: ReactElement,
}

const defaultInstructionsHtml = `
    <p>
        Programmez le robot pour qu'il pousse les caisses sur les cases marquées.
    </p>
    <p>
        Pour pousser une caisse, mettez d'abord le robot face à la caisse, il avancera en la poussant.
    </p>
    <div class="advice">
        Pour le fonctionnement des blocs de boucle, pense à regarder la documentation.
    </div>
    <p class="long">
        Plus de détails sur la mission
    </p>
`;

export function TaskInstructions(props: TaskInstructionsProps) {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const platform = useAppSelector(state => state.options.platform);
    const contextId = useAppSelector(state => state.task.contextId);
    const isBackend = useAppSelector(state => state.options.backend);
    const taskInstructionsHtmlFromOptions = useAppSelector(state => state.options.taskInstructions);
    const [instructionsHtml, setInstructionsHtml] = useState(null);
    const instructionsRef = useRef<HTMLDivElement>();

    useEffect(() => {
        let newInstructionsHtml = taskInstructionsHtmlFromOptions ? taskInstructionsHtmlFromOptions : defaultInstructionsHtml;
        const context = quickAlgoLibraries.getContext(null, 'main');
        if (context && window.algoreaInstructionsStrings && window.getAlgoreaInstructionsAsHtml && currentTask.gridInfos.intro) {
            const strLang = window.stringsLanguage;
            const strings = window.algoreaInstructionsStrings[strLang];
            let newInstructions = window.getAlgoreaInstructionsAsHtml(strings, currentTask.gridInfos, currentTask.data, taskLevel);
            if (newInstructions) {
                const innerText = window.jQuery(newInstructions).text();
                if (innerText.length) {
                    newInstructionsHtml = newInstructions;
                }
            }
        }

        const instructionsJQuery = window.jQuery(`<div>${newInstructionsHtml}</div>`);
        for (let availablePlatform of platformsList) {
            if (platform !== availablePlatform) {
                instructionsJQuery.find(`[data-lang="${availablePlatform}"]`).remove();
            }
        }
        for (let availableLevel of taskLevelsList) {
            if (taskLevel !== availableLevel) {
                instructionsJQuery.find(`.${availableLevel}`).remove();
            }
        }

        setInstructionsHtml(instructionsJQuery.html());

        if (props.changeDisplayShowMore) {
            let hasShortOrLong = 0 < instructionsJQuery.find('.short').length || 0 < instructionsJQuery.find('.long').length;
            props.changeDisplayShowMore(hasShortOrLong);
        }
    }, [contextId]);

    if (!instructionsHtml && !isBackend) {
        return null;
    }

    return (
        <div ref={instructionsRef} className={`task-mission level-${taskLevel} platform-${platform}`} style={{fontSize: `${zoomLevel}rem`}}>
            {props.missionRightSlot}

            <h1>Votre mission</h1>

            <div dangerouslySetInnerHTML={toHtml(instructionsHtml)}/>
        </div>
    );
}

TaskInstructions.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
