import React, {ReactElement, useEffect, useRef, useState} from "react";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";
import {formatTaskInstructions} from './utils';
import {Button} from '@blueprintjs/core';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus';
import {Screen} from '../common/screens';
import {ActionTypes as CommonActionTypes} from '../common/actionTypes';
import {useDispatch} from 'react-redux';
import {documentationConceptSelected} from './documentation/documentation_slice';
import {faMinus} from '@fortawesome/free-solid-svg-icons/faMinus';
import {quickAlgoLibraries} from './libs/quickalgo_libraries';
import {TaskInstructionsTabs} from './instructions/TaskInstructionsTabs';
import {convertHtmlInstructionsToReact} from './instructions/instructions';

export interface TaskInstructionsProps {
    changeDisplayShowMore?: (display: boolean) => void,
    missionRightSlot?: ReactElement,
    withoutTitle?: boolean,
    expanded?: boolean,
    hideShowMoreButton?: boolean,
}

function findStringForLanguage(taskStrings: any[], languages: string[]) {
    for (let language of languages) {
        let taskString = taskStrings.find(string => string.language === language);
        if (taskString) {
            return taskString;
        }
    }

    return taskStrings[0];
}

const defaultInstructionsHtml = `
    <p>
        Programmez le robot pour qu'il pousse les caisses sur les cases marquées.
    </p>
    <p>
        Pour pousser une caisse, mettez d'abord le robot face à la caisse, il avancera en la poussant.
        <a onclick="changeTaskLevel('medium')">Aller au tuto</a>
    </p>
    <div class="advice">
        Pour le fonctionnement des blocs de boucle, pense à regarder la documentation.
    </div>
    <p class="easy medium hard">
      Aide : <a class="aide" onclick="conceptViewer.showConcept('blockly_controls_repeat')">
      <span data-lang="blockly scratch">Boucle de répétition</span>
      <span data-lang="python">Boucle for</span></a>
    </p>
    <p class="long">
        Plus de détails sur la mission
    </p>
    
    <div class="instructions-tabs">
      <div class="instructions-tab" data-title="Règle du jeu">
        <div>
        C’est à ton tour de jouer. Lance le dé et déplace ton pion d’autant de cases que la valeur obtenue sur le dé. Retourne la case d’arrivée de ton pion.
        </div>
      </div>
      
      <div class="instructions-tab" data-title="Votre mission">
        <div class="instructions-page">
          <p>Page 1</p>
          <p>Page 1</p>
          <p>Page 1</p>
          <p>Page 1</p>
          <p>Page 1</p>
        </div>
         <div class="instructions-page">
          <p>Page 2</p>
          <p>Page 2</p>
          <p>Page 2</p>
          <p>Page 2</p>
          <p>Page 2</p>
        </div>
         <div class="instructions-page">
          <p>Page 3</p>
          <p>Page 3</p>
          <p>Page 3</p>
          <p>Page 3</p>
          <p>Page 3</p>
          <p>Page 3</p>
        </div>
      </div>
      
      <div class="instructions-tab" data-title="Conseil">
        <div class="instructions-page">
          <p>Page 1</p>
        </div>
         <div class="instructions-page">
          <p>Page 2</p>
        </div>
         <div class="instructions-page">
          <p>Page 3</p>
        </div>
      </div>
    </div>
`;

export function TaskInstructions(props: TaskInstructionsProps) {
    const zoomLevel = useAppSelector(state => state.layout.zoomLevel);
    const currentTask = useAppSelector(state => state.task.currentTask);
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const contextId = useAppSelector(state => state.task.contextId);
    const isBackend = useAppSelector(state => state.options.backend);
    const language = useAppSelector(state => state.options.language.split('-')[0]);
    const taskInstructionsHtmlFromOptions = useAppSelector(state => state.options.taskInstructions);
    const [instructionsTitle, setInstructionsTitle] = useState(null);
    const [instructionsHtml, setInstructionsHtml] = useState(null);
    const [instructionsTabs, setInstructionsTabs] = useState(null);
    const instructionsRef = useRef<HTMLDivElement>();
    const screen = useAppSelector(state => state.screen);
    const documentationOpen = Screen.DocumentationSmall === screen || Screen.DocumentationBig === screen;
    const dispatch = useDispatch();
    const platform = useAppSelector(state => state.options.platform);
    const [hasShortOrLong, setHasShortOrLong] = useState(false);

    const toggleTaskInstructions = () => {
        if (documentationOpen) {
            dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: null}});
        } else {
            dispatch(documentationConceptSelected('task-instructions'));
            dispatch({type: CommonActionTypes.AppSwitchToScreen, payload: {screen: Screen.DocumentationSmall}});
        }
    };

    useEffect(() => {
        let newInstructionsHtml = taskInstructionsHtmlFromOptions ? taskInstructionsHtmlFromOptions : defaultInstructionsHtml;
        const context = quickAlgoLibraries.getContext(null, 'main');
        let newInstructionsTitle = null;
        if (currentTask && currentTask.strings && currentTask.strings.length) {
            const instructions = findStringForLanguage(currentTask.strings, [language, 'en', 'fr']);
            if (instructions.title) {
                newInstructionsTitle = instructions.title;
            }
            newInstructionsHtml = instructions.statement;
        } else if (context && window.algoreaInstructionsStrings && window.getAlgoreaInstructionsAsHtml && currentTask.gridInfos.intro) {
            const strLang = window.stringsLanguage;
            if (strLang in window.algoreaInstructionsStrings) {
                const strings = window.algoreaInstructionsStrings[strLang];
                let newInstructions = window.getAlgoreaInstructionsAsHtml(strings, currentTask.gridInfos, currentTask.data, taskLevel);
                if (newInstructions) {
                    const innerText = window.jQuery(newInstructions).text();
                    if (innerText.length) {
                        newInstructionsHtml = newInstructions;
                    }
                }
            }
        }

        let instructionsJQuery = formatTaskInstructions(newInstructionsHtml, platform, taskLevel);
        let hasTabs = false;
        if (0 < instructionsJQuery.find('.instructions-tabs').length) {
            hasTabs = true;
            if (props.expanded) {
                const tabsContainer = instructionsJQuery.find('.instructions-tabs');
                const tabs = tabsContainer.find('.instructions-tab').toArray().map((tabDiv: HTMLDivElement) => {
                    return {
                        title: tabDiv.getAttribute('data-title'),
                        element: tabDiv,
                    };
                })
                setInstructionsTabs(tabs);
            } else {
                instructionsJQuery = instructionsJQuery.find('.main-instructions');
                setInstructionsTabs(null);
            }
        } else {
            setInstructionsTabs(null);
        }

        setInstructionsTitle(newInstructionsTitle);
        setInstructionsHtml(instructionsJQuery.html());

        let hasShortOrLongInstructions = 0 < instructionsJQuery.find('.short').length || 0 < instructionsJQuery.find('.long').length;
        setHasShortOrLong(hasShortOrLongInstructions);
        if (props.changeDisplayShowMore) {
            props.changeDisplayShowMore(hasShortOrLongInstructions || hasTabs);
        }

        setTimeout(() => {
            if (window.instructionsPostProcessing?.length) {
                for (let postProcessingCallback of window.instructionsPostProcessing) {
                    postProcessingCallback();
                }
            }
        });
    }, [contextId]);

    if (!instructionsHtml && !isBackend) {
        return null;
    }

    return (
        <div ref={instructionsRef} className={`task-mission ${props.expanded ? 'is-expanded' : ''}`} style={{fontSize: `${zoomLevel}rem`}}>
            {props.missionRightSlot}

            {!props.withoutTitle && <h1>{instructionsTitle ? instructionsTitle : getMessage('TASK_INSTRUCTIONS')}</h1>}

            {instructionsTabs ?
                <TaskInstructionsTabs
                    tabs={instructionsTabs}
                />
                :
                <div>{convertHtmlInstructionsToReact(instructionsHtml, platform)}</div>
            }

            {!props.hideShowMoreButton && !props.expanded && hasShortOrLong && <Button
                className="quickalgo-button mt-2"
                onClick={toggleTaskInstructions}
                icon={<FontAwesomeIcon icon={documentationOpen ? faMinus : faPlus}/>}
            >{getMessage(documentationOpen ? 'TASK_INSTRUCTIONS_LESS' : 'TASK_INSTRUCTIONS_MORE')}</Button>}
        </div>
    );
}

TaskInstructions.computeDimensions = (width: number, height: number) => {
    return {
        taken: {width, height},
        minimum: {width: 200, height: 100},
    }
}
