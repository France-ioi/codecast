import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {Carousel} from 'react-bootstrap';
import {useDispatch} from "react-redux";
import {useAppSelector} from "../../hooks";
import {toHtml} from "../../utils/sanitize";
import {hintUnlocked, selectAvailableHints} from "./hints_slice";
import {getMessage} from '../../lang';
import {formatTaskInstructions} from '../utils';

export interface TaskHintProps {
    askHintClassName?: string
}

export function TaskHints(props: TaskHintProps) {
    const availableHints = useAppSelector(selectAvailableHints);
    const unlockedHintIds = useAppSelector(state => state.hints.unlockedHintIds);
    const taskLevel = useAppSelector(state => state.task.currentLevel);
    const platform = useAppSelector(state => state.options.platform);

    const carouselElements = unlockedHintIds.map(unlockedHintId => {
        const instructionsJQuery = formatTaskInstructions(availableHints[unlockedHintId].content, platform, taskLevel);

        return (
            <div key={unlockedHintId} className="hint-carousel-item" dangerouslySetInnerHTML={toHtml(instructionsJQuery.html())}></div>
        )
    });

    const nextAvailableHint = [...availableHints.keys()].find(key => -1 === unlockedHintIds.indexOf(key));

    const dispatch = useDispatch();

    const unlockNextHint = () => {
        dispatch(hintUnlocked(nextAvailableHint));
    };

    if (undefined !== nextAvailableHint) {
        carouselElements.push(
            <div className="hint-carousel-item hint-unlock">
                <div className={`hint-button ${props.askHintClassName}`} onClick={unlockNextHint}>
                    {getMessage('TRALALERE_HINTS_ASK')}
                </div>
            </div>
        );
    }

    return (
        <div className="hints-container">
            <div className="hints-content">
                <Carousel
                    interval={null}
                    wrap={false}
                    prevIcon={<FontAwesomeIcon icon={faChevronLeft} size="lg"/>}
                    nextIcon={<FontAwesomeIcon icon={faChevronRight} size="lg"/>}
                >
                    {carouselElements.map((child, index) => <Carousel.Item key={index}>{child}</Carousel.Item>)}
                </Carousel>
            </div>
        </div>
    );
}
