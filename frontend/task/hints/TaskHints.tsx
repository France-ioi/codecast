import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronLeft, faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {Carousel} from 'react-bootstrap';
import {useDispatch} from "react-redux";
import {useAppSelector} from "../../hooks";
import {toHtml} from "../../utils/sanitize";
import {hintUnlocked} from "./hints_slice";

export function TaskHints() {
    const dispatch = useDispatch();

    const availableHints = useAppSelector(state => state.hints.availableHints);
    // const availableHints = [
    //     {content: 'aazazaz'},
    //     {content: 'aazazazazazazz'},
    // ];
    const unlockedHintIds = useAppSelector(state => state.hints.unlockedHintIds);

    const carouselElements = unlockedHintIds.map(unlockedHintId => {
        return (
            <div key={unlockedHintId} className="hint-carousel-item" dangerouslySetInnerHTML={toHtml(availableHints[unlockedHintId].content)}></div>
        )
    });

    const nextAvailableHint = [...availableHints.keys()].find(key => -1 === unlockedHintIds.indexOf(key));

    const unlockNextHint = () => {
        dispatch(hintUnlocked(nextAvailableHint));
    };

    if (undefined !== nextAvailableHint) {
        carouselElements.push(
            <div className="hint-carousel-item hint-unlock">
                <div className="tralalere-button hint-button" onClick={unlockNextHint}>
                    Demander un indice
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
