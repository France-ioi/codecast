import React, {useCallback, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {Carousel} from 'react-bootstrap';
import {useDispatch} from "react-redux";
import {useAppSelector} from "../../hooks";
import {hintUnlocked, selectAvailableHints} from "./hints_slice";
import {getMessage} from '../../lang';
import {TaskHint} from './TaskHint';
import log from 'loglevel';

export interface TaskHintProps {
    askHintClassName?: string
}

export function TaskHints(props: TaskHintProps) {
    const availableHints = useAppSelector(selectAvailableHints);
    const unlockedHintIds = useAppSelector(state => state.hints.unlockedHintIds);
    const [displayedHintId, setDisplayedHintId] = useState(unlockedHintIds.length ? unlockedHintIds[0] : null);
    const displayedHintIndex = null === displayedHintId ? unlockedHintIds.length : unlockedHintIds.indexOf(displayedHintId);
    const displayedHint = availableHints.find(hint => displayedHintId === hint.id);
    const nextAvailableHint = availableHints.find(hint => -1 === unlockedHintIds.indexOf(hint.id));
    const canAskMoreHints = undefined !== nextAvailableHint && !displayedHint?.question && !displayedHint?.disableNext;

    const dispatch = useDispatch();

    const unlockNextHint = () => {
        dispatch(hintUnlocked(nextAvailableHint.id));
        setDisplayedHintId(nextAvailableHint.id);
    };

    const goToHintId = useCallback((hintId: string) => {
        if (-1 === unlockedHintIds.indexOf(hintId)) {
            dispatch(hintUnlocked(hintId));
        }
        setDisplayedHintId(hintId);
    }, []);


    let currentHintPreviousId = null;
    let currentHintNextId = null;
    if (displayedHint) {
        if (!displayedHint.disableNext && !displayedHint.question) {
            if (displayedHint.nextHintId) {
                currentHintNextId = displayedHint.nextHintId;
            }
        }

        if (!displayedHint.disablePrevious) {
            if (displayedHint.previousHintId) {
                currentHintPreviousId = displayedHint.previousHintId;
            } else {
                const previousHintIndex = displayedHintIndex - 1;
                if (unlockedHintIds[previousHintIndex]) {
                    currentHintPreviousId = unlockedHintIds[previousHintIndex];
                }
            }
        }
    }

    const handleSelect = (selectedIndex) => {
        if (selectedIndex === displayedHintIndex - 1) {
            // Back
            if (currentHintPreviousId) {
                goToHintId(currentHintPreviousId);
            }
        } else if (selectedIndex === displayedHintIndex + 1) {
            // Next
            if (currentHintNextId) {
                goToHintId(currentHintNextId);
            } else if (canAskMoreHints) {
                setDisplayedHintId(null);
            }
        }
    };


    const carouselElements = unlockedHintIds.map(unlockedHintId => {
        return <TaskHint
            key={unlockedHintId}
            hint={availableHints.find(hint => unlockedHintId === hint.id)}
            askHintClassName={props.askHintClassName}
            goToHintId={goToHintId}
        />;
    });

    if (canAskMoreHints) {
        carouselElements.push(
            <div className="hint-carousel-item hint-unlock">
                <div className={`hint-button ${props.askHintClassName}`} onClick={unlockNextHint}>
                    {getMessage('TRALALERE_HINTS_ASK')}
                </div>
            </div>
        );
    }

    log.getLogger('hints').debug('current hint id', {displayedHint, displayedHintId, displayedHintIndex, unlockedHintIds, currentHintPreviousId, currentHintNextId, canAskMoreHints})

    return (
        <div className="hints-container">
            <div className={`hints-content ${null === currentHintPreviousId ? 'has-no-previous' : ''} ${null === currentHintNextId && !canAskMoreHints ? 'has-no-next' : ''}`}>
                <Carousel
                    activeIndex={displayedHintIndex}
                    onSelect={handleSelect}
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
