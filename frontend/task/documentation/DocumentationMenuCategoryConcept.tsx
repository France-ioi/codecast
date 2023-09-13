import React, {useState} from 'react';
import {DocumentationConcept} from "./documentation_slice";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {DocumentationMenuConcept} from './DocumentationMenuConcept';
import {faChevronDown} from '@fortawesome/free-solid-svg-icons/faChevronDown';
import {faChevronUp} from '@fortawesome/free-solid-svg-icons/faChevronUp';
import {Collapse} from 'react-bootstrap';
import {Icon} from '@blueprintjs/core';

export interface DocumentationMenuCategoryConceptProps {
    category: DocumentationConcept,
    subConcepts: DocumentationConcept[],
}

export function DocumentationMenuCategoryConcept(props: DocumentationMenuCategoryConceptProps) {
    const {category, subConcepts} = props;
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`documentation-tab-left ${expanded ? 'is-expanded' : ''}`}>
            <div className="documentation-concepts-category-title" onClick={() => setExpanded(!expanded)}>
                <div className="documentation-concepts-category-title-name">
                    <div className="documentation-tab-title">
                        <Icon icon="dot"/>
                        <span>{category.name}</span>
                    </div>
                </div>
                <div className="category-fold">
                    <div className="category-fold-button">
                        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown}/>
                    </div>
                </div>
            </div>

            <Collapse in={expanded}>
                <div>
                    <div className="documentation-concepts-category-subconcepts">
                        {subConcepts.map(concept =>
                            <DocumentationMenuConcept
                                key={concept.id}
                                concept={concept}
                            />
                        )}
                    </div>
                </div>
            </Collapse>
        </div>
    )
}
