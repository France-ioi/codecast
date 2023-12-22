import {Dialog} from '@blueprintjs/core';
import React, {useState} from 'react';
import {useAppSelector} from '../../hooks';

interface AnalysisVariableImageProps {
    imageUrl: string,
}

export function AnalysisVariableImage(props: AnalysisVariableImageProps) {
    const [imageOpen, setImageOpen] = useState(false);
    const taskPlatformUrl = useAppSelector(state => state.options.taskPlatformUrl);

    const imageUrl = `${taskPlatformUrl}/image-cache/${props.imageUrl}`;

    return (
        <span>
            <span onClick={() => setImageOpen(true)} className="analysis-variable-link">{props.imageUrl}</span>

            <Dialog
                isOpen={imageOpen}
                canOutsideClickClose={true}
                canEscapeKeyClose={true}
                onClose={() => setImageOpen(false)}
            >
                <img src={imageUrl} className="analysis-variable-image"/>
            </Dialog>
        </span>
    );
}
