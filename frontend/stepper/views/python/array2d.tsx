import React from 'react';

import {extractView} from './array2d_model';
import {renderArrow, renderValue} from './utils';
import {SvgPan} from '../SvgPan';
import {DirectiveFrame} from "../DirectiveFrame";
import {StepperControls} from "../../index";

const TEXT_LINE_HEIGHT = 18;
const TEXT_BASELINE = 5; // from bottom
const STRIKE_THROUGH_HEIGHT = 5; // from baseline
const TEXT_ARROW_HEIGHT = 4; // from baseline to arrow point
const TEXT_ARROW_SPACING = 2;
const ARROW_HEAD_SIZE = 6;
const ARROW_TAIL_SIZE = 15;
const CELL_WIDTH = 60;  // to fit a negative double
const CELL_HEIGHT = 2 * TEXT_LINE_HEIGHT + 3;
const GRID_LEFT = TEXT_LINE_HEIGHT * 4 + ARROW_TAIL_SIZE;
const GRID_TOP = TEXT_LINE_HEIGHT * 4 + ARROW_TAIL_SIZE;
const GRID_BORDER_LEFT = 5;
const GRID_BORDER_TOP = 5;
const GRID_STROKE = "#777";
const GRID_STROKEWidth = "1";
const COL_NUM_WIDTH = 20;

interface Array2DParams {
    rowCursors: any,
    colCursors: any,
    rowCount: any,
    colCount: any,
    height: any,
    rowInfoMap?: any,
    colInfoMap?: any,
    error?: string
}

// left offset: big enough to fit a cursor with 10 characters
// top offset: 2 line (cursors) + arrow + 1 line (column index)
// directive named argument to set view height

function drawCells(view) {
    const {ref} = view;
    const elements = [];

    ref.cur.v.forEach(function(rowList, i) {
        const y1 = TEXT_LINE_HEIGHT - TEXT_BASELINE;
        const y1a = y1 - STRIKE_THROUGH_HEIGHT;
        const y2 = TEXT_LINE_HEIGHT * 2 - TEXT_BASELINE;

        let oldRowList = null;
        if (ref.old && ref.old instanceof Sk.builtin.list && ref.old.v.hasOwnProperty(i)) {
            oldRowList = ref.old.v[i];
        }

        rowList.v.forEach(function(cellElement, j) {
            const x = 0.5 * CELL_WIDTH;

            let oldCellElement = null;
            if (oldRowList && oldRowList.v.hasOwnProperty(j)) {
                oldCellElement = oldRowList.v[j];
            }

            elements.push(
                <g key={`${i},${j}`} transform={`translate(${j * CELL_WIDTH},${i * CELL_HEIGHT})`}
                   clipPath="url(#cell)">
                    {oldCellElement && (oldCellElement !== cellElement) && <g>
                        <text x={x} y={y1} textAnchor="middle" fill="#777">
                            {renderValue(oldCellElement.v)}
                        </text>
                        <line x1={5} x2={CELL_WIDTH - 5} y1={y1a} y2={y1a} stroke="#777" strokeWidth="1"/>
                    </g>}
                    <text x={x} y={y2} textAnchor="middle" fill="#000">
                        {renderValue(cellElement.v)}
                    </text>
                </g>
            );
        });
    });

    return <g transform={`translate(${GRID_LEFT},${GRID_TOP})`}>{elements}</g>;
}

function getCellClasses(ref, row, column, rowCursor, colCursor, loadedReferences) {
    const rootList = ref.cur;
    const rowList = rootList.v[row];

    if (
        ref.old &&
        ref.old instanceof Sk.builtin.list &&
        ref.old.v.hasOwnProperty(row) &&
        ref.old.v[row] instanceof Sk.builtin.list &&
        ref.old.v[row].v.hasOwnProperty(column) &&
        ref.old.v[row].v[column] !== rowList.v[column]
    ) {
        return 'cell cell-store';
    }
    if (loadedReferences.hasOwnProperty(rowList._uuid + '_' + column)) {
        return 'cell cell-load';
    }
    if (rowCursor || colCursor) {
        return 'cell cell-cursor';
    }

    return 'cell';
}

function drawGrid(view) {
    const {ref, rowCount, colCount, rowInfoMap, colInfoMap, loadedReferences} = view;
    const elements = [];

    // Cell backgrounds
    for (let i = 0; i < rowCount; i++) {
        for (let j = 0; j < colCount; j++) {
            const x1 = GRID_LEFT + j * CELL_WIDTH;
            const y1 = GRID_TOP + i * CELL_HEIGHT;
            const classes = getCellClasses(ref, i, j, rowInfoMap[i], colInfoMap[j], loadedReferences);

            elements.push(<rect key={`r${i},${j}`} x={x1} y={y1} width={CELL_WIDTH} height={CELL_HEIGHT}
                                className={classes}/>);
        }
    }

    // Horizontal lines
    const x1 = GRID_LEFT, x2 = x1 + colCount * CELL_WIDTH;
    for (let i = 0, y = GRID_TOP; i <= rowCount; i += 1, y += CELL_HEIGHT) {
        elements.push(<line key={`h${i}`} x1={x1} x2={x2} y1={y} y2={y} stroke={GRID_STROKE}
                            strokeWidth={GRID_STROKEWidth}/>);
    }

    // Vertical lines
    const y1 = GRID_TOP, y2 = y1 + rowCount * CELL_HEIGHT;
    for (let j = 0, x = GRID_LEFT; j <= colCount; j += 1, x += CELL_WIDTH) {
        elements.push(<line key={`v${j}`} x1={x} x2={x} y1={y1} y2={y2} stroke={GRID_STROKE}
                            strokeWidth={GRID_STROKEWidth}/>);
    }

    // Row labels
    let y = GRID_TOP + (CELL_HEIGHT + TEXT_LINE_HEIGHT) / 2 - TEXT_BASELINE;
    let x = GRID_LEFT - GRID_BORDER_LEFT;
    for (let i = 0; i < rowCount; i += 1, y += CELL_HEIGHT) {
        elements.push(
            <text key={`lr${i}`} x={x} y={y} textAnchor="end" fill="#777">{i}</text>
        );
    }

    // Column labels
    x = GRID_LEFT + CELL_WIDTH / 2;
    y = GRID_TOP - GRID_BORDER_TOP - TEXT_BASELINE;
    for (let i = 0; i < colCount; i += 1, x += CELL_WIDTH) {
        elements.push(
            <text key={`lc${i}`} x={x} y={y} textAnchor='middle' fill='#777'>{i}</text>
        );
    }

    return <g className="grid">{elements}</g>;
}

function drawRowCursors(rowCount, colCount, infoMap) {
    const elements = [];
    const x0 = GRID_LEFT;
    const x1 = -GRID_BORDER_LEFT - (TEXT_ARROW_SPACING + ARROW_TAIL_SIZE);
    const x2 = x1 - COL_NUM_WIDTH;
    const y1 = (CELL_HEIGHT + TEXT_LINE_HEIGHT) / 2 - TEXT_BASELINE;
    const y2 = y1 - TEXT_ARROW_HEIGHT;

    for (let i in infoMap) {
        const cursor = infoMap[i];
        const y0 = GRID_TOP + CELL_HEIGHT * cursor.index;
        const label = cursor.labels.join(',');
        elements.push(
            <g key={label}>
                {renderArrow(x0 + x1, y0 + y2, 'right', ARROW_HEAD_SIZE, ARROW_TAIL_SIZE)}
                <text x={x0 + x2} y={y0 + y1}>{label}</text>
            </g>);
    }

    return <g className='row-cursors'>{elements}</g>;
}

function drawColCursors(colCount, rowCount, infoMap) {
    const elements = [];
    const y0 = GRID_TOP;
    const x1 = CELL_WIDTH / 2;
    const y1 = -GRID_BORDER_TOP - TEXT_LINE_HEIGHT - TEXT_BASELINE;
    const y2 = y1 - (TEXT_BASELINE + TEXT_ARROW_SPACING + ARROW_TAIL_SIZE);

    for (let j in infoMap) {
        const cursor = infoMap[j];
        const x0 = GRID_LEFT + CELL_WIDTH * cursor.index;
        const label = cursor.labels.join(',');
        const y3 = cursor.row * TEXT_LINE_HEIGHT;

        elements.push(
            <g key={label}>
                {renderArrow(x0 + x1, y0 + y1, 'down', ARROW_HEAD_SIZE, ARROW_TAIL_SIZE + y3)}
                <text x={x0 + x1} y={y0 + y2 - y3}>{label}</text>
            </g>
        );
    }

    return <g className='col-cursors'>{elements}</g>;
}

interface Array2DProps {
    scale: any,
    directive: any,
    context: any,
    controls: StepperControls,
    onChange: Function
}

export class Array2D extends React.PureComponent<Array2DProps> {
    render() {
        const {scale, directive, context} = this.props;

        /**
         * Eg. directive :
         *
         * _VIEW_matrix = "showArray2D(matrix, rowCursors=[line], colCursors=[col], rows=2, cols=3)"
         *
         * Other options :
         * - height = The height of the view in px (default : special value "auto")
         *
         * Object return :
         * byName: {
         *   rowCursors: ["line"],
         *   rows: 2,
         *   colCursors:
         *   ["col"],
         *   cols: 3
         * }
         * byPos: ["matrix"]
         * key: "matrix"
         * kind: "showArray2D"
         */
        const {byName, byPos} = directive;
        const {rowCursors, colCursors} = byName;
        const height = (byName.height) ? byName.height : 'auto';
        const rowCount = (byName.rows) ? parseInt(byName.rows) : 0;
        const colCount = (byName.cols) ? parseInt(byName.cols) : 0;
        const view: Array2DParams = {rowCursors, colCursors, rowCount, colCount, height};
        const {hPan, vPan} = this.getPosition();

        const extractedView = extractView(context, byPos[0], view);
        Object.assign(view, extractedView);
        if (view.error) {
            return (
                <DirectiveFrame {...this.props}>
                    <div className='clearfix'>{view.error}</div>
                </DirectiveFrame>
            );
        }

        const {rowInfoMap, colInfoMap} = view;
        const svgHeight = GRID_TOP + (view.rowCount + 1) * CELL_HEIGHT;
        const divHeight = ((height === 'auto' ? svgHeight : height) * scale) + 'px';

        return (
            <DirectiveFrame {...this.props}>
                <div className='clearfix' style={{padding: '2px'}}>
                    <div style={{width: '100%', height: divHeight}}>
                        <SvgPan width='100%' height={svgHeight * scale} scale={scale} x={hPan * CELL_WIDTH}
                                y={vPan * CELL_HEIGHT} getPosition={this.getPosition} onPan={this.onPan}
                                className="array2d">
                            <clipPath id="cell">
                                <rect x="0" y="0" width={CELL_WIDTH} height={CELL_HEIGHT}/>
                            </clipPath>
                            <g style={{fontFamily: 'Open Sans', fontSize: '13px'}}>
                                {drawGrid(view)}
                                {drawRowCursors(rowCount, colCount, rowInfoMap)}
                                {drawColCursors(colCount, rowCount, colInfoMap)}
                                {drawCells(view)}
                            </g>
                        </SvgPan>
                    </div>
                </div>
            </DirectiveFrame>
        );
    }

    getPosition = () => {
        const {controls} = this.props;
        const hPan = controls.hPan;
        const vPan = controls.vPan;

        return {hPan, vPan};
    };

    onPan = ({hPan, vPan}, dx, dy) => {
        hPan -= dx / CELL_WIDTH;
        vPan -= dy / CELL_HEIGHT;

        this.props.onChange(this.props.directive, {hPan, vPan});
    };
}
