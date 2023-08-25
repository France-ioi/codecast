import React, {ReactFragment, useEffect, useState} from 'react';
import {Icon} from "@blueprintjs/core";
import {useDispatch} from "react-redux";
import {ActionTypes as CommonActionTypes} from "../../common/actionTypes";
import {
    documentationLoad,
    documentationOpenInNewWindow,
    documentationUseCodeExample,
    sendCodeExampleToOpener
} from "./doc";
import {useAppSelector} from "../../hooks";
import {DocumentationConcept, documentationConceptSelected} from "./documentation_slice";
import {Screen} from "../../common/screens";
import {call, select} from "typed-redux-saga";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faExternalLinkAlt} from "@fortawesome/free-solid-svg-icons";
import {getMessage} from "../../lang";
import {TaskInstructions} from '../TaskInstructions';
import {DocumentationLanguageSelector} from './DocumentationLanguageSelector';
import {DocumentationMenuConcept} from './DocumentationMenuConcept';
import {DocumentationMenuCategoryConcept} from './DocumentationMenuCategoryConcept';

interface DocumentationProps {
    standalone: boolean,
    hasTaskInstructions?: boolean,
    header?: ReactFragment,
}

export function Documentation(props: DocumentationProps) {
    const dispatch = useDispatch();

    const concepts = useAppSelector(state => state.documentation.concepts);
    const selectedConceptId = useAppSelector(state => state.documentation.selectedConceptId);
    const selectedConcept = selectedConceptId ? concepts.find(concept => selectedConceptId === concept.id) : null;
    const documentationLanguage = useAppSelector(state => state.documentation.language);
    const screen = useAppSelector(state => state.screen);
    const firstConcepts = concepts.filter(concept => !concept.isCategory).slice(0, 3);
    const isTralalere = useAppSelector(state => 'tralalere' === state.options.app);
    const canChangePlatform = useAppSelector(state => state.options.canChangePlatform);

    const conceptsByCategory: {[conceptId: string]: {category: DocumentationConcept, subConcepts: DocumentationConcept[]}} = {};
    for (let concept of concepts.filter(concept => concept.isCategory)) {
        conceptsByCategory[concept.id] = {
            category: concept,
            subConcepts: [],
        };
    }
    for (let concept of concepts.filter(concept => !concept.isCategory && undefined !== concept.categoryId && null !== concept.categoryId)) {
        if (!(concept.categoryId in conceptsByCategory)) {
            throw "This category id does not exist: " + concept.categoryId;
        }
        conceptsByCategory[concept.categoryId].subConcepts.push(concept);
    }

    const [iframeRef, setIframeRef] = useState(null);

    let conceptUrl = null;
    if (selectedConcept && selectedConcept.url) {
        const urlSplit = selectedConcept.url.split('#');
        if (urlSplit[1]) {
            urlSplit[urlSplit.length - 1] = documentationLanguage + '-' + urlSplit[urlSplit.length - 1];
        } else {
            urlSplit[1] = documentationLanguage;
        }
        if (isTralalere) {
            urlSplit[0] = urlSplit[0].replace(/index\.html/g, 'index_tralalere.html');
            urlSplit[0] = urlSplit[0].replace(/index_en\.html/g, 'index_tralalere_en.html');
        }
        conceptUrl = urlSplit.join('#');
        if (-1 !== conceptUrl.indexOf('http://') && 'https:' === window.location.protocol) {
            conceptUrl = conceptUrl.replace(/http:\/\//, 'https://');
        }
    }

    useEffect(() => {
        dispatch(documentationLoad(props.standalone, false !== props.hasTaskInstructions));
    }, [documentationLanguage]);

    const iframeLoaded = () => {
        const docWindow = iframeRef.contentWindow;
        const channel = window.Channel.build({window: docWindow, origin: '*', scope: 'snippet'});

        channel.notify({
            method: 'setupConceptDisplaySnippets',
            timeout: 50,
        });

        channel.bind('useCodeExample', (instance, {code, language}) => {
            if (code) {
                if (props.standalone) {
                    sendCodeExampleToOpener(code, language);
                } else {
                    useCodeExample(code, language);
                }
            }
        });
    };

    const openDocumentationInNewWindow = () => {
        dispatch(documentationOpenInNewWindow(false !== props.hasTaskInstructions));
    };

    const useCodeExample = (code, language) => {
        if (!code) {
            return;
        }

        dispatch(documentationUseCodeExample(code, language));
    };

    const openDocumentationBig = () => {
        dispatch({
            type: CommonActionTypes.AppSwitchToScreen,
            payload: {screen: Screen.DocumentationBig},
        });
    };

    const closeDocumentation = () => {
        dispatch({
            type: CommonActionTypes.AppSwitchToScreen,
            payload: {screen: null},
        });
    };

    const selectConcept = (concept) => {
        dispatch(documentationConceptSelected(concept.id));
    };

    const chooseConceptFromDropdown = (event) => {
        const selectedConceptId = event.target.value;
        const selectedConcept = concepts.find(concept => selectedConceptId === concept.id);
        selectConcept(selectedConcept);
    }

    return (
        <div className={`documentation ${Screen.DocumentationBig === screen ? 'is-big' : 'is-small'} ${props.standalone ? 'is-standalone' : ''}`}>
            {props.header ? props.header : <div className="documentation-header">
                <div className="documentation-header-icon">
                    <Icon icon="zoom-in"/>
                </div>
                <h2>{getMessage('TASK_DOCUMENTATION')}</h2>
                {canChangePlatform && <div className="documentation-language-selector">
                    <DocumentationLanguageSelector/>
                </div>}
                {!props.standalone && <div className="documentation-new-window">
                    <a onClick={openDocumentationInNewWindow}>
                        <FontAwesomeIcon icon={faExternalLinkAlt}/>
                    </a>
                </div>}
                {(!props.standalone || Screen.DocumentationBig === screen) && <div className="documentation-close-container">
                    <div className="documentation-close" onClick={closeDocumentation}>
                    </div>
                </div>}
            </div>}
            <div className="documentation-language-dropdown">
                <div className="documentation-tabs-menu">
                    <Icon icon="code"/>
                </div>
                {canChangePlatform && <div className="documentation-category-selector">
                    <DocumentationLanguageSelector/>
                </div>}
            </div>
            <div className="documentation-category-dropdown">
                <div className="documentation-tabs-menu">
                    <a onClick={openDocumentationBig} className="hidden-mobile">
                        <Icon icon="properties"/>
                    </a>
                    <span className="visible-mobile">
                        <Icon icon="properties"/>
                    </span>
                </div>
                <div className="documentation-category-selector">
                    <label className='bp3-label documentation-select'>
                        <div className='bp3-select'>
                            <select onChange={chooseConceptFromDropdown} value={selectedConcept ? selectedConcept.id : undefined}>
                                {firstConcepts.map(concept =>
                                    <option value={concept.id} key={concept.id}>{concept.name}</option>
                                )}
                            </select>
                        </div>
                    </label>
                </div>
            </div>
            <div className="documentation-tabs">
                <div className="documentation-tabs-menu">
                    <a onClick={openDocumentationBig}>
                        <Icon icon="properties"/>
                    </a>
                </div>
                {firstConcepts.map(concept =>
                    <React.Fragment key={concept.id}>
                        {selectedConceptId === concept.id ? <div className={`documentation-tab is-active`}>
                            <div className="documentation-tab-title">{concept.name}</div>
                        </div> : <a className={`documentation-tab`} onClick={() => selectConcept(concept)}>
                            <div className="documentation-tab-title">{concept.name}</div>
                        </a>}
                    </React.Fragment>
                )}
                <div className="documentation-tabs-end"/>
            </div>
            <div className="documentation-body">
                <div className="documentation-menu">
                    <div>
                        {Object.values(conceptsByCategory).filter(({subConcepts}) => 0 < subConcepts.length).map(({category, subConcepts}) =>
                            <DocumentationMenuCategoryConcept
                                key={category.id}
                                category={category}
                                subConcepts={subConcepts}
                            />
                        )}
                        {concepts.filter(concept => !concept.categoryId && !concept.isCategory).map(concept =>
                            <DocumentationMenuConcept
                                key={concept.id}
                                concept={concept}
                            />
                        )}
                    </div>
                </div>
                {selectedConcept &&
                    <div className="documentation-aside">
                        <div className="documentation-category-title">
                            <div className="documentation-header-icon is-blue">
                                <Icon icon="zoom-in"/>
                            </div>
                            <h2>{selectedConcept.name}</h2>
                        </div>
                        <div className="documentation-content">
                            {'task-instructions' === selectedConcept.id ?
                                <div className="documentation-task-instructions">
                                    <TaskInstructions
                                        expanded
                                        withoutTitle
                                    />
                                </div>
                                :
                                <iframe
                                    className="documentation-viewer-content"
                                    name="viewerContent"
                                    src={conceptUrl}
                                    onLoad={iframeLoaded}
                                    key={conceptUrl}
                                    ref={setIframeRef}
                                />
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    );
}
