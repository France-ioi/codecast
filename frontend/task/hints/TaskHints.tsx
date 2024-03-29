import React, {useCallback, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {Carousel} from 'react-bootstrap';
import {useDispatch} from "react-redux";
import {useAppSelector} from "../../hooks";
import {hintUnlocked} from "./hints_slice";
import {getMessage} from '../../lang';
import {TaskHint} from './TaskHint';
import log from 'loglevel';
import {selectAvailableHints} from './hints_selectors';

export interface TaskHintProps {
    askHintClassName?: string
}

export function TaskHints(props: TaskHintProps) {
    const availableHints = useAppSelector(selectAvailableHints);
    const unlockedHintIds = useAppSelector(state => state.hints.unlockedHintIds.filter(hintId => availableHints.find(hint => hintId === hint.id)));
    const [displayedHintId, setDisplayedHintId] = useState(unlockedHintIds.length ? unlockedHintIds[unlockedHintIds.length - 1] : null);
    const displayedHintIndex = null === displayedHintId ? unlockedHintIds.length : unlockedHintIds.indexOf(displayedHintId);
    const displayedHint = availableHints.find(hint => displayedHintId === hint.id);
    const nextAvailableHint = availableHints.find(hint => -1 === unlockedHintIds.indexOf(hint.id));
    const nextHintToUnlockId = useRef(nextAvailableHint ? nextAvailableHint.id : null);
    let canAskMoreHints = undefined !== nextAvailableHint && !displayedHint?.question && !displayedHint?.disableNext;

    const dispatch = useDispatch();

    const unlockNextHint = () => {
        dispatch(hintUnlocked(nextHintToUnlockId.current));
        setDisplayedHintId(nextHintToUnlockId.current);
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
        nextHintToUnlockId.current = nextAvailableHint ? nextAvailableHint.id : null;
        if (!displayedHint.disableNext && !displayedHint.question) {
            if (displayedHint.nextHintId) {
                if (availableHints.find(hint => displayedHint.nextHintId === hint.id)) {
                    // If we are on a question, redirect directly to next hint
                    // If we are not on a question, redirect to next hint if it's unlocked, otherwise redirect to new hint screen
                    if (displayedHint.question) {
                        currentHintNextId = displayedHint.nextHintId;
                    } else {
                        if (-1 !== unlockedHintIds.indexOf(displayedHint.nextHintId) || availableHints.find(hint => displayedHint.nextHintId === hint.id).immediate) {
                            currentHintNextId = displayedHint.nextHintId;
                        } else {
                            nextHintToUnlockId.current = displayedHint.nextHintId;
                        }
                    }
                } else {
                    canAskMoreHints = false;
                }
            } else {
                const nextHintIndex = displayedHintIndex + 1;
                if (unlockedHintIds[nextHintIndex]) {
                    currentHintNextId = unlockedHintIds[nextHintIndex];
                }
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

    const handleSelect = (selectedIndex: number) => {
        const nextHintId = unlockedHintIds[selectedIndex];

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
        } else if (nextHintId) {
            goToHintId(nextHintId);
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

    const displayIndicators = !!(displayedHint && (!displayedHint.question && !displayedHint.nextHintId && !displayedHint.previousHintId));

    log.getLogger('hints').debug('current hint id', {displayedHint, displayedHintId, displayedHintIndex, unlockedHintIds, currentHintPreviousId, currentHintNextId, canAskMoreHints, displayIndicators});

    return (
        <div className="hints-container">
            <div className={`hints-content ${null === currentHintPreviousId ? 'has-no-previous' : ''} ${null === currentHintNextId && !canAskMoreHints ? 'has-no-next' : ''}`}>
                <Carousel
                    activeIndex={displayedHintIndex}
                    onSelect={handleSelect}
                    interval={null}
                    wrap={false}
                    indicators={displayIndicators}
                    prevIcon={<FontAwesomeIcon icon={faChevronLeft} size="lg"/>}
                    nextIcon={<FontAwesomeIcon icon={faChevronRight} size="lg"/>}
                >
                    {carouselElements.map((child, index) => <Carousel.Item key={index}>{child}</Carousel.Item>)}
                </Carousel>
            </div>
        </div>
    );
}
