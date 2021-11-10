import React from 'react';
import range from 'node-range';

export function Stars({starsCount, rating}) {
    const filledStars = starsCount * rating;

    const starPath = [[25,60],[5,37],[35,30],[50,5],[65,30],[95,37],[75,60],[78,90],[50,77],[22,90]];

    const formatStarPath = (path) => {
        return 'M' + path.map(pathElement => pathElement.join(',')).join('L') + 'Z';
    };

    const uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const starIds = range(0, starsCount).map(() => uuidv4());

    return (
        <span className="star-rating">
            {range(0, starsCount).map(star =>
                <svg
                    key={star}
                    height="13"
                    version="1.1"
                    width="15"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 22 22"
                >
                    <clipPath id={starIds[star]} clipPathUnits="objectBoundingBox">
                        <rect x="0" y="0" width={star < filledStars - 1 ? 1 : (star > filledStars ? 0 : (filledStars - star))} height="1" />
                    </clipPath>
                    <path
                        fill={'#fff'}
                        stroke="none"
                        d={formatStarPath(starPath)}
                        transform="matrix(0.24,0,0,0.24,0,0)"
                        strokeWidth="4.2"
                    >
                    </path>
                    <path
                        fill={'#ffc90e'}
                        stroke="none"
                        x={"0"}
                        y={"0"}
                        width={"100"}
                        height={"100"}
                        d={formatStarPath(starPath)}
                        clipPath={`url(#${starIds[star]})`}
                        transform="matrix(0.24,0,0,0.24,0,0)"
                        strokeWidth="4.2"
                    >
                    </path>
                    <path
                        fill="none"
                        stroke="#000000"
                        d="M25,60L5,37L35,30L50,5L65,30L95,37L75,60L78,90L50,77L22,90Z"
                        strokeWidth="5"
                        transform="matrix(0.24,0,0,0.24,0,0)"
                    >
                    </path>
                </svg>
            )}
        </span>
    );
}