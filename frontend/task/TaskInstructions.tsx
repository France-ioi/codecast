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
import {PlatformSelection} from '../common/PlatformSelection';
import convertHtmlToReact, {processNodes} from '@hedgedoc/html-to-react';
import {Editor} from '../buffers/Editor';
import {platformsList} from '../stepper/platforms';
import {generatePropsFromAttributes} from '@hedgedoc/html-to-react/dist/utils/generatePropsFromAttributes';
import {VOID_ELEMENTS} from '@hedgedoc/html-to-react/dist/dom/elements/VoidElements';
import {SmartContractStorage} from './libs/smart_contract/SmartContractStorage';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';

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
`;

function transformNode(node, index: string|number, context: {platform: CodecastPlatform}) {
    if (node.attribs && 'select-lang-selector' in node.attribs) {
        return <PlatformSelection key="platform-selection" withoutLabel/>;
    } else if (node.attribs && 'smart-contract-storage' in node.attribs) {
        return <SmartContractStorage/>;
    } else if (node.attribs && 'data-show-source' in node.attribs) {
        const code = node.attribs['data-code'];
        const lang = node.attribs['data-lang'];

        if ('all' !== lang && context.platform !== lang) {
            return null;
        }

        const sourceMode = platformsList[context.platform].aceSourceMode;

        return <Editor
            content={code.trim()}
            readOnly
            mode={sourceMode}
            width="100%"
            hideGutter
            hideCursor
            showPrintMargin={false}
            highlightActiveLine={false}
            dragEnabled={false}
            maxLines={Infinity}
        />
    } else if (node.attribs && 'onclick' in node.attribs) {
        const tagName = node.tagName;
        const props = generatePropsFromAttributes(node.attribs, index);
        // @ts-ignore
        props['onClick'] = () => {
            eval(node.attribs.onclick);
        }

        // If the node is not a void element and has children then process them
        let children = null;
        if (VOID_ELEMENTS.indexOf(tagName) === -1) {
            children = processNodes(node.children, (node, index) => transformNode(node, index, context));
        }

        return React.createElement(tagName, props, children)
    }

    return undefined;
}

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

        const instructionsJQuery = formatTaskInstructions(newInstructionsHtml, platform, taskLevel);
        setInstructionsTitle(newInstructionsTitle);
        setInstructionsHtml(instructionsJQuery.html());

        let hasShortOrLongInstructions = 0 < instructionsJQuery.find('.short').length || 0 < instructionsJQuery.find('.long').length;
        setHasShortOrLong(hasShortOrLongInstructions);
        if (props.changeDisplayShowMore) {
            props.changeDisplayShowMore(hasShortOrLongInstructions);
        }
    }, [contextId]);

    if (!instructionsHtml && !isBackend) {
        return null;
    }

    return (
        <div ref={instructionsRef} className={`task-mission ${props.expanded ? 'is-expanded' : ''}`} style={{fontSize: `${zoomLevel}rem`}}>
            {props.missionRightSlot}

            {!props.withoutTitle && <h1>{instructionsTitle ? instructionsTitle : getMessage('TASK_INSTRUCTIONS')}</h1>}

            <div>{convertHtmlToReact(instructionsHtml, {transform: (node, index) => transformNode(node, index, {platform})})}</div>
            {/*<div dangerouslySetInnerHTML={toHtml(instructionsHtml)}/>*/}

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
