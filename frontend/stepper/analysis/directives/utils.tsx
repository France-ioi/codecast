import React from 'react';

export type DirectiveVariableName = string|[string, string];

export const renderValue = function(value) {
    if (value === undefined) {
        return 'noval';
    }
    if (value === null) {
        return 'null';
    }

    return value.toString();
};

const computeArrowPoints = function(p, headSize, tailSize) {
    const dx1 = headSize;
    const dy1 = headSize;
    const dx2 = headSize / 5;
    const dy2 = tailSize;
    return [p(0, 0), p(-dx1, dy1), p(-dx2, dy1), p(-dx2, dy2), p(dx2, dy2), p(dx2, dy1), p(dx1, dy1), p(0, 0)].join(' ');
};

const arrowDirFunc = {
    up: (dx, dy) => `${+dx},${+dy}`,
    down: (dx, dy) => `${+dx},${-dy}`,
    left: (dx, dy) => `${+dy},${+dx}`,
    right: (dx, dy) => `${-dy},${+dx}`
};
export const renderArrow = function(x: number, y: number, dir: 'right' | 'down' | 'up' | 'left', headSize: number, tailSize: number, style?: {}) {
    const ps = computeArrowPoints(arrowDirFunc[dir], headSize, tailSize);

    return <polygon points={ps} transform={`translate(${x},${y})`} {...style} />;
};

