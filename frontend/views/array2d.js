
import React from 'react';
import EpicComponent from 'epic-component';

export const Array2D = EpicComponent(self => {

    // @11px, line height 17, offset 12
  const textLineHeight = 17;
  const textBaseline = 5; // from bottom
  const cellWidth = 28;
  const cellHeight = 4 * textLineHeight + 20;

  const baseline = function (i) {
    return textLineHeight * (i + 1) - textBaseline;
  };

  const arrowPoints = function (x0, y0, width, height) {
    const dx1 = width;
    const dx2 = width / 5;
    const dy1 = height / 3;
    const dy2 = height;
    return `${x0},${y0} ${x0-dx1},${y0+dy1} ${x0-dx2},${y0+dy1} ${x0-dx2},${y0+dy2} ${x0+dx2},${y0+dy2} ${x0+dx2},${y0+dy1} ${x0+dx1},${y0+dy1} ${x0},${y0}`;
  }

  const renderCell = function (cell) {
    const {content, last} = cell;
    const y0 = baseline(0);
    const y0a = y0 - (textLineHeight - textBaseline) / 3;
    const y1 = baseline(1);
    const y2 = baseline(2);
    return (
      <g transform={`translate(${5 + i * cellWidth},5)`} clipPath="url(#cell)">
        {'store' in content && <g>
          <text x={cellWidth/2} y={y0} textAnchor="middle" fill="#777">
            {renderValue(content.previous)}
          </text>
          <line x1={2} x2={cellWidth-2} y1={y0a} y2={y0a} stroke="#777" strokeWidth="2"/>
        </g>}
        {last ||
          <g>
            <rect x="0" y={textLineHeight} width={cellWidth} height={textLineHeight} stroke="black" fill={cursors.length > 0 ? '#eef' : 'transparent'} strokeWidth="1"/>
            <text x={cellWidth/2} y={y1} textAnchor="middle">
              {renderValue(content.current)}
            </text>
          </g>}
        <text x={cellWidth/2} y={y2} textAnchor="middle" fill="#777">{i}</text>
        {cursors.length > 0 &&
          <g>
            <polygon points={arrowPoints(cellWidth/2, textLineHeight * 3, 6, 20)}/>
            <text x={cellWidth/2} y={cellHeight - textBaseline} textAnchor="middle">
              {cursors.map(cursor => cursor.name.join(' '))}
            </text>
          </g>}
      </g>
    );
  };

  const renderRow = function (row, i) {
    return <g></g>;
  };

  self.render = function () {
    const {rows} = self.props;
    return (
      <div className='clearfix'>
        <svg width="100%" viewBox={`0 0 1000 ${cellHeight}`} version="1.1" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="cell">
              <rect x="0" y="0" width={cellWidth} height={cellHeight} stroke-width="5"/>
          </clipPath>
          {rows.map(renderRow)}
        </svg>
      </div>
    );
  };

});
