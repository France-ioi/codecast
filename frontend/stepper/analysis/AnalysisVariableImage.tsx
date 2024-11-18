import {Dialog} from '@blueprintjs/core';
import React, {useState} from 'react';
import {useAppSelector} from '../../hooks';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faImage} from '@fortawesome/free-solid-svg-icons';
import {CodecastAnalysisVariable} from './analysis';

interface AnalysisVariableImageProps {
    variables: CodecastAnalysisVariable[],
}

export function AnalysisVariableImage(props: AnalysisVariableImageProps) {
    const [imageOpen, setImageOpen] = useState(false);

    const fileName = props.variables.find(variable => 'fileName' === variable.name).value;
    const fileUrl = props.variables.find(variable => 'fileUrl' === variable.name).value.replace(/"/g, '');


    return (
        <span>
            <span onClick={() => setImageOpen(true)} className="analysis-variable-link value-scalar">
                <FontAwesomeIcon icon={faImage} className="mr-1"/>
                <span>Image({fileName})</span>
            </span>

            <Dialog
                isOpen={imageOpen}
                canOutsideClickClose={true}
                canEscapeKeyClose={true}
                onClose={() => setImageOpen(false)}
            >
                <img src={fileUrl} className="analysis-variable-image"/>
            </Dialog>
        </span>
    );
}
