import React, {useState} from 'react';
import {DocumentationConcept} from "./documentation_slice";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {DocumentationMenuConcept} from './DocumentationMenuConcept';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
import {faChevronUp} from '@fortawesome/free-solid-svg-icons/faChevronUp';

export interface DocumentationMenuCategoryConceptProps {
    category: DocumentationConcept,
    subConcepts: DocumentationConcept[],
}

export function DocumentationMenuCategoryConcept(props: DocumentationMenuCategoryConceptProps) {
    const {category, subConcepts} = props;
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="documentation-tab-left">
            <div className="documentation-concepts-category-title">
                <div className="documentation-concepts-category-title-name">
                    {category.name}
                </div>
                <div className="category-fold">
                    <div className="category-fold-button" onClick={() => setExpanded(!expanded)}>
                        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown}/>
                    </div>
                </div>
            </div>

            {expanded ? subConcepts.map(concept =>
                <DocumentationMenuConcept
                    key={concept.id}
                    concept={concept}
                />
            ) : null}
        </div>
    )
}
