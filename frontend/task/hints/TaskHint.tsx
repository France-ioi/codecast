import React from "react";
import {useAppSelector} from "../../hooks";
import {toHtml} from "../../utils/sanitize";
import {TaskHint} from "./hints_slice";
import {formatTaskInstructions} from '../utils';
import {getMessage} from '../../lang';
import {formatCodeHelpHint} from './codehelp';

export interface TaskHintProps {
    hint?: TaskHint,
    askHintClassName?: string,
    goToHintId: (hintId: string) => void,
}

export function TaskHint(props: TaskHintProps) {
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const platform = useAppSelector(state => state.options.platform);
    const hint = props.hint;

    const answerYes = () => {
        goToHint(props.hint.yesHintId);
    };

    const answerNo = () => {
        goToHint(props.hint.noHintId);
    };

    const goToHint = (hintId: string) => {
        props.goToHintId(hintId);
    }

    if (hint.codeHelp) {
        const formattedCodeHelp = formatCodeHelpHint(hint);

        return (
            <div
                className="hint-carousel-item"
            >
                {!!hint.codeHelp.issue && <p style={{fontWeight: 'bold'}}>{hint.codeHelp.issue}</p>}

                {formattedCodeHelp}
            </div>
        );
    }

    const instructionsJQuery = formatTaskInstructions(hint.content, platform, taskLevel);

    if (hint.question) {
        return (
            <div
                className="hint-carousel-item"
            >
                <div
                    className="hint-question"
                    dangerouslySetInnerHTML={toHtml(instructionsJQuery.html())}
                />

                <div className="hint-buttons">
                    <div className={`hint-button ${props.askHintClassName}`} onClick={answerYes}>
                        {getMessage('YES')}
                    </div>

                    <div className={`hint-button ${props.askHintClassName}`} onClick={answerNo}>
                        {getMessage('NO')}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="hint-carousel-item"
            dangerouslySetInnerHTML={toHtml(instructionsJQuery.html())}
        />
    );
}
