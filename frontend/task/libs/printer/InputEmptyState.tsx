import React from "react";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faEyeSlash} from '@fortawesome/free-solid-svg-icons/faEyeSlash';

export interface InputEmptyStateProps {
    text: string,
}

export function InputEmptyState(props: InputEmptyStateProps) {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                <FontAwesomeIcon icon={faEyeSlash}/>
            </div>

            <div className="empty-state-text">
                {props.text}
            </div>
        </div>
    );
}
