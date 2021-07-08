import React, {useEffect} from 'react';
import {Icon} from "@blueprintjs/core";
import {useDispatch} from "react-redux";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {documentationLoad} from "./documentation";
import {useAppSelector} from "../hooks";
import {documentationConceptSelected} from "./documentation_slice";

export function Documentation() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(documentationLoad());
    }, []);

    const closeDocumentation = () => {
        dispatch({
            type: CommonActionTypes.AppSwitchToScreen,
            payload: {screen: null},
        });
    };

    const selectConcept = (concept) => {
        dispatch(documentationConceptSelected(concept.id));
    };

    const concepts = useAppSelector(state => state.documentation.concepts);
    const selectedConceptId = useAppSelector(state => state.documentation.selectedConceptId);
    const selectedConcept = selectedConceptId ? concepts.find(concept => selectedConceptId === concept.id) : null;
    const firstConcepts = concepts.slice(0, 3);

    return (
        <div className="documentation">
            <div className="documentation-header">
                <div className="documentation-header-icon">
                    <Icon icon="zoom-in"/>
                </div>
                <h2>Informations</h2>
                <div className="documentation-language-selector">
                    Python
                </div>
                <div className="documentation-close-container">
                    <div className="documentation-close" onClick={closeDocumentation}>
                    </div>
                </div>
            </div>
            <div className="documentation-tabs">
                <div className="documentation-tabs-menu">
                    <Icon icon="properties"/>
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
            {selectedConcept &&
                <React.Fragment>
                  <div className="documentation-category-title">
                    <div className="documentation-header-icon is-blue">
                      <Icon icon="zoom-in"/>
                    </div>
                    <h2>{selectedConcept.name}</h2>
                  </div>
                  <div className="documentation-content">
                    <iframe
                      className="documentation-viewer-content"
                      name="viewerContent"
                      src={selectedConcept.url}
                    />
                  </div>
                </React.Fragment>
            }
        </div>
    );
}
