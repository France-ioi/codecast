import {Carousel} from 'react-bootstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight} from '@fortawesome/free-solid-svg-icons';
import React, {ReactElement, useState} from 'react';

export interface TaskInstructionsSlideshowProps {
    slides: (ReactElement | string | null)[],
}

export function TaskInstructionsSlideshow(props: TaskInstructionsSlideshowProps) {
    const [displayedSlideIndex, setDisplayedSlideIndex] = useState(0);

    const handleSelect = (selectedIndex: number) => {
        setDisplayedSlideIndex(selectedIndex);
    };

    return (
        <Carousel
            activeIndex={displayedSlideIndex}
            onSelect={handleSelect}
            interval={null}
            wrap={false}
            indicators={true}
            prevIcon={<FontAwesomeIcon icon={faChevronLeft} size="lg"/>}
            nextIcon={<FontAwesomeIcon icon={faChevronRight} size="lg"/>}
        >
            {props.slides.map((child, index) => <Carousel.Item key={index}>{child}</Carousel.Item>)}
        </Carousel>
    )
};
