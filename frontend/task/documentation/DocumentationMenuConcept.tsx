import React from 'react';
import {DocumentationConcept, documentationConceptSelected} from "./documentation_slice";
import {useAppSelector} from '../../hooks';
import {Icon} from '@blueprintjs/core';
import {useDispatch} from 'react-redux';

export interface DocumentationMenuConceptProps {
    concept: DocumentationConcept,
}

export function DocumentationMenuConcept(props: DocumentationMenuConceptProps) {
    const selectedConceptId = useAppSelector(state => state.documentation.selectedConceptId);
    const concept = props.concept;
    const dispatch = useDispatch();

    const selectConcept = (concept: DocumentationConcept) => {
        dispatch(documentationConceptSelected(concept.id));
    };

    return (
        <React.Fragment key={concept.id}>
            {selectedConceptId === concept.id ? <div className={`documentation-tab-left is-active`}>
                <div className="documentation-tab-title">
                    <Icon icon="dot"/>
                    <span>{concept.name}</span>
                </div>
            </div> : <a className={`documentation-tab-left`} onClick={() => selectConcept(concept)}>
                <div className="documentation-tab-title">
                    <Icon icon="dot"/>
                    <span>{concept.name}</span>
                </div>
            </a>}
        </React.Fragment>
    )
}
