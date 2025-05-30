import convertHtmlToReact, {processNodes} from '@hedgedoc/html-to-react';
import {platformsList} from '../../stepper/platforms';
import {PlatformSelection} from '../../common/PlatformSelection';
import {SmartContractStorage} from '../libs/smart_contract/SmartContractStorage';
import {Editor} from '../../buffers/Editor';
import {generatePropsFromAttributes} from '@hedgedoc/html-to-react/dist/utils/generatePropsFromAttributes';
import {VOID_ELEMENTS} from '@hedgedoc/html-to-react/dist/dom/elements/VoidElements';
import React from 'react';
import {AppStore} from '../../store';
import {formatTaskInstructions} from '../utils';
import {TaskLevelName} from '../platform/platform_slice';
import {memoize} from 'proxy-memoize';
import {quickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {CodecastPlatform} from '../../stepper/codecast_platform';
import {TaskInstructionsVideo} from './TaskInstructionsVideo';
import {QuickAlgoLibrary} from '../libs/quickalgo_library';
import {TaskInstructionsSlideshow} from './TaskInstructionsSlideshow';
import {TaskStringNormalized} from '../task_types';
import {TaskLimits} from '../TaskLimits';

function findStringForLanguage(taskStrings: TaskStringNormalized[], languages: string[]): TaskStringNormalized {
    for (let language of languages) {
        let taskString = taskStrings.find(string => string.language === language);
        if (taskString) {
            return taskString;
        }
    }

    return taskStrings[0];
}

export function selectLanguageStrings(state: AppStore): TaskStringNormalized {
    const currentTask = state.task.currentTask;
    if (null === currentTask || !currentTask.strings?.length) {
        return null;
    }

    const language = state.options.language.split('-')[0];

    return findStringForLanguage(currentTask.strings, [language, 'en', 'fr']);
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
<pre>Hello MOOC!</pre>
<p class="variant_1">
    Uniquement variante 1
</p>
<p class="variant_2">
    Uniquement variante 2
</p>
<p class="variant_1 variant_2">
    Variante 1 et variante 2
</p>
<div class="long">
  <p>Plus de détails sur la mission</p>
  <div data-slideshow>
    <div id="image-container">
      <center><img id="diaporama" src="build/images/11_variable_08_sokoban/slides/diapo_01_blockly.png" alt="Diaporama"></center>
    </div>
    <div id="image-container">
      <center><img id="diaporama" src="build/images/11_variable_08_sokoban/slides/diapo_02_blockly.png" alt="Diaporama"></center>
    </div>
  </div>
</div>
<div class="basic">
    <div class="hints">
        <div class="hint">
            Hint 1
        </div>
        <div class="hint">
            Hint 2
        </div>
    </div>
    <div class="success-message">
        <p>Test</p>
        <p>Success basic</p>
    </div>
</div>
<div class="easy">
    <div class="hints">
        <div class="hint">
            Hint 1
        </div>
    </div>
    <div class="success-message">
        <p>Test</p>
        <p>Success easy</p>
    </div>
</div>
    
    
<!--    <div class="instructions-tabs">-->
<!--      <div class="instructions-tab" data-title="Règle du jeu">-->
<!--        <div>-->
<!--        C’est à ton tour de jouer. Lance le dé et déplace ton pion d’autant de cases que la valeur obtenue sur le dé. Retourne la case d’arrivée de ton pion.-->
<!--        </div>-->
<!--      </div>-->
<!--      -->
<!--      <div class="instructions-tab" data-title="Votre mission">-->
<!--        <div class="instructions-page">-->
<!--          <p>Page 1</p>-->
<!--          <p>Page 1</p>-->
<!--          <p>Page 1</p>-->
<!--          <p>Page 1</p>-->
<!--          <p>Page 1</p>-->
<!--        </div>-->
<!--         <div class="instructions-page">-->
<!--          <p>Page 2</p>-->
<!--          <p>Page 2</p>-->
<!--          <p>Page 2</p>-->
<!--          <p>Page 2</p>-->
<!--          <p>Page 2</p>-->
<!--        </div>-->
<!--         <div class="instructions-page">-->
<!--          <p>Page 3</p>-->
<!--          <p>Page 3</p>-->
<!--          <p>Page 3</p>-->
<!--          <p>Page 3</p>-->
<!--          <p>Page 3</p>-->
<!--          <p>Page 3</p>-->
<!--        </div>-->
<!--      </div>-->
<!--      -->
<!--      <div class="instructions-tab" data-title="Conseil">-->
<!--        <div class="instructions-page">-->
<!--          <p>Page 1</p>-->
<!--        </div>-->
<!--         <div class="instructions-page">-->
<!--          <p>Page 2</p>-->
<!--        </div>-->
<!--         <div class="instructions-page">-->
<!--          <p>Page 3</p>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->
`;

export const getInstructionsForLevelSelector = memoize(({state, context}: {state: AppStore, context: QuickAlgoLibrary}) => {
    const taskInstructionsHtmlFromOptions = state.options.taskInstructions;
    const currentTask = state.task.currentTask;
    const taskLevel = state.task.currentLevel;

    let newInstructionsHtml = taskInstructionsHtmlFromOptions ? taskInstructionsHtmlFromOptions : null;
    // let newInstructionsHtml = defaultInstructionsHtml;
    let newInstructionsTitle = null;
    if (currentTask && currentTask.strings && currentTask.strings.length) {
        const instructions = selectLanguageStrings(state);
        if (instructions.title) {
            newInstructionsTitle = instructions.title;
        }
        newInstructionsHtml = instructions.statement;
    } else if (context && window.algoreaInstructionsStrings && window.getAlgoreaInstructionsAsHtml && currentTask?.gridInfos.intro) {
        const strLang = window.stringsLanguage;
        if (strLang in window.algoreaInstructionsStrings) {
            const strings = window.algoreaInstructionsStrings[strLang];
            const platform = state.options.platform;
            let newInstructions = window.getAlgoreaInstructionsAsHtml(strings, state.task.levelGridInfos, currentTask.data, taskLevel, platform);
            if (newInstructions) {
                const innerText = window.jQuery(newInstructions).text();
                if (innerText.length) {
                    newInstructionsHtml = newInstructions;
                }
            }
        }
    }
    return {
        html: newInstructionsHtml,
        title: newInstructionsTitle
    };
});

export const getFormattedInstructionsForLevelSelector = memoize(({state, context}: {state: AppStore, context: QuickAlgoLibrary}) => {
    const html = getInstructionsForLevelSelector({state, context}).html;
    const platform = state.options.platform;
    const taskLevel = state.task.currentLevel;
    const taskVariant = state.options.taskVariant;

    return formatTaskInstructions(html, platform, taskLevel, taskVariant);
});

export const getTaskSuccessMessageSelector = memoize((state: AppStore) => {
    const context = quickAlgoLibraries.getContext(null, state.environment);
    const instructionsJQuery = getFormattedInstructionsForLevelSelector({state, context});

    return instructionsJQuery.find('.success-message').length ? instructionsJQuery.find('.success-message').html() : null;
});

export const getTaskHintsSelector = memoize((state: AppStore) => {
    const context = quickAlgoLibraries.getContext(null, state.environment);
    const html = getInstructionsForLevelSelector({state, context}).html;
    const platform = state.options.platform;

    let hints = [];

    const addHintsForLevel = (level: TaskLevelName) => {
        const instructionsJQuery = formatTaskInstructions(html, platform, level);
        if (instructionsJQuery.find('.hints').length) {
            const levelHints = instructionsJQuery.find('.hints').first().children('div').toArray().map(elm => {
                return {
                    content: elm.innerHTML.trim(),
                    minScore: elm.getAttribute('data-min-score') ? Number(elm.getAttribute('data-min-score')) : undefined,
                    id: elm.getAttribute('data-id') ? elm.getAttribute('data-id') : undefined,
                    question: elm.hasAttribute('data-question'),
                    previousHintId: elm.getAttribute('data-previous-hint-id') ? elm.getAttribute('data-previous-hint-id') : undefined,
                    nextHintId: elm.getAttribute('data-next-hint-id') ? elm.getAttribute('data-next-hint-id') : undefined,
                    yesHintId: elm.getAttribute('data-yes-hint-id') ? elm.getAttribute('data-yes-hint-id') : undefined,
                    noHintId: elm.getAttribute('data-no-hint-id') ? elm.getAttribute('data-no-hint-id') : undefined,
                    disablePrevious: elm.hasAttribute('data-disable-previous'),
                    disableNext: elm.hasAttribute('data-disable-next'),
                    immediate: elm.hasAttribute('data-immediate'),
                    levels: [level],
                };
            });

            hints = [...hints, ...levelHints];
        }
    };

    if (Object.keys(state.platform.levels).length) {
        for (let level of Object.keys(state.platform.levels)) {
            addHintsForLevel(level as TaskLevelName);
        }
    } else {
        addHintsForLevel(null);
    }

    return hints.length ? hints : null;
});

function getNodeText(node) {
    if ('text' === node.type) {
        return node.data;
    }

    const nodeTexts = [];
    for (let subNode of node.children) {
        nodeTexts.push(getNodeText(subNode));
    }

    return nodeTexts.join(' ');
}

function transformNode(node, index: string|number, context: {platform: CodecastPlatform}) {
    if (node.attribs && 'select-lang-selector' in node.attribs) {
        return <PlatformSelection key="platform-selection" withoutLabel/>;
    } else if (node.attribs && 'smart-contract-storage' in node.attribs) {
        return <SmartContractStorage/>;
    } else if (node.attribs && ('data-show-source' in node.attribs || ('class' in node.attribs && -1 !== node.attribs['class'].indexOf('language-')))) {
        let code, lang;
        if ('data-show-source' in node.attribs) {
            code = node.attribs['data-code'];
            lang = node.attribs['data-lang'];
        } else {
            code = getNodeText(node);
            lang = node.attribs['class'].substring(node.attribs['class'].indexOf('language-') + 'language-'.length).split(' ')[0];
        }

        const sourceMode = platformsList[context.platform].aceSourceMode;

        return <div style={{marginBottom: 20}} data-lang={lang}><Editor
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
        /></div>;
    } else if (node.attribs && 'data-task-limits' in node.attribs) {
        return <TaskLimits/>;
    } else if (node.attribs && 'data-slideshow' in node.attribs) {
        let children = processNodes(node.children, (node, index) => transformNode(node, index, context))
            .filter(a => 'string' !== typeof a);

        return <TaskInstructionsSlideshow
            slides={children}
        />;
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
    } else if (node.attribs && 'class' in node.attribs && -1 !== node.attribs['class'].split(' ').indexOf('videoBtn')) {
        let children = processNodes(node.children, (node, index) => transformNode(node, index, context));
        const props = generatePropsFromAttributes({
            style: 'data-style' in node.attribs ? node.attribs['data-style'] : null,
        }, index);

        return <TaskInstructionsVideo
            url={node.attribs['data-video']}
            style={props['style'] as React.CSSProperties}
        >
            {React.createElement('div', props, children)}
        </TaskInstructionsVideo>
    }

    return undefined;
}

export function convertHtmlInstructionsToReact(instructionsHtml: string, platform: CodecastPlatform) {
    return convertHtmlToReact(instructionsHtml, {transform: (node, index) => transformNode(node, index, {platform})})
}
