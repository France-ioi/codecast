import React from 'react';
import classnames from 'classnames';

import {renderArrow, renderValue} from './utils';
import {extractView} from './array_utils';
import {SvgPan} from '../../views/SvgPan';
import {DirectiveFrame} from '../../views/DirectiveFrame';
import {StepperControls} from "../../index";
import {CodecastAnalysisVariable} from "../analysis";

const TEXT_LINE_HEIGHT = 18;
const TEXT_BASELINE = 5; // from bottom
const ARROW_WIDTH = 6;
const MIN_ARROW_HEIGHT = 20;

const DEFAULT_CELL_WIDTH = 28;
const DEFAULT_MAX_VISIBLE_CELLS = 40;
const DEFAULT_CURSOR_ROWS = 1;

interface Array1DView {
    dim: any,
    cursors: any,
    cursorRows: any,
    maxVisibleCells: any,
    fullView: any,
    cellHeight: any,
    cellWidth: any,
    error?: string,
    cursorMap?: any,
    ref?: any
}

function baseline(i) {
    return TEXT_LINE_HEIGHT * (i + 1) - TEXT_BASELINE;
}

function getCellClasses(ref: CodecastAnalysisVariable, index, cursor) {
    const list = ref.variables;

    if (ref.variables && ref.variables.length && index in ref.variables && null !== ref.variables[index].previousValue && ref.variables[index].previousValue !== ref.variables[index].value) {
        return 'cell cell-store';
    }
    if (list[index].loaded) {
        return 'cell cell-load';
    }
    if (cursor) {
        return 'cell cell-cursor';
    }

    return 'cell';
}

function Grid({view, cellWidth}) {
    const {ref, cursorMap} = view;
    const elements = [];

    const nbRows = (ref.variables) ? ref.variables.length : 0;

    // Column labels and horizontal lines
    const y1 = TEXT_LINE_HEIGHT;
    const y2 = TEXT_LINE_HEIGHT * 2;
    const y3 = baseline(2);
    for (let i = 0, x = 0; i < nbRows; i += 1, x += cellWidth) {
        const cellClasses = getCellClasses(ref, i, cursorMap[i]);

        elements.push(
            <g key={`h${i}`}>
                <text x={x + cellWidth / 2} y={y3} className="index">{i}</text>
                <rect x={x} y={y1} width={cellWidth} height={TEXT_LINE_HEIGHT} className={cellClasses}/>
                <line x1={x} x2={x + cellWidth} y1={y1} y2={y1} className={classnames(['h', 't'])}/>
                <line x1={x} x2={x + cellWidth} y1={y2} y2={y2} className={classnames(['h', 'b'])}/>
            </g>
        );
    }

    // Vertical lines
    for (let i = 0, x = 0; i <= nbRows; i += 1, x += cellWidth) {
        elements.push(<line key={`v${i}`} x1={x} x2={x} y1={y1} y2={y2} className="v"/>);
    }

    return <g className="grid">{elements}</g>;
}

function Cell({view, index}) {
    const {ref, cellWidth} = view;
    const y0 = baseline(0);
    const y0a = y0 - (TEXT_LINE_HEIGHT - TEXT_BASELINE) / 3;
    const y1 = baseline(1);

    const cellElement = ref.variables[index];

    let oldElement = null;
    if (ref.variables && ref.variables.length && index in ref.variables) {
        oldElement = ref.variables[index].previousValue;
    }

    return (
        <g transform={`translate(${index * cellWidth},0)`} clipPath="url(#cell)">
            {null !== oldElement && (oldElement !== cellElement.value) &&
            <g className="previous-content">
                <text x={cellWidth / 2} y={y0}>
                    {renderValue(oldElement)}
                </text>
                <line x1={2} x2={cellWidth - 2} y1={y0a} y2={y0a}/>
            </g>}
            <text x={cellWidth / 2} y={y1} className="current-content">
                {cellElement && renderValue(cellElement.value)}
            </text>
        </g>
    );
}

function Cursor({view, cursor}) {
    const {cellWidth} = view;
    const {labels, col, row} = cursor;
    const arrowTop = TEXT_LINE_HEIGHT * 3;
    const arrowHeight = MIN_ARROW_HEIGHT + row * TEXT_LINE_HEIGHT;
    const cursorsY = baseline(3) + arrowHeight;

    return (
        <g transform={`translate(${col * cellWidth},0)`}>
            {renderArrow(cellWidth / 2, arrowTop, 'up', ARROW_WIDTH, arrowHeight)}
            <text x={cellWidth / 2} y={cursorsY}>
                {labels.join(',')}
            </text>
        </g>
    );
}

interface Array1DProps {
    controls: StepperControls,
    directive: any,
    context: any,
    scale: any,
    onChange: Function
}

export class Array1D extends React.PureComponent<Array1DProps> {
    _cellWidth = DEFAULT_CELL_WIDTH;

    render() {
        const {controls, directive, context, scale} = this.props;

        /**
         * Eg. directive :
         *
         * _VIEW_arr = "showArray(arr, cursors=[index])"
         *
         * Other options:
         * - cursorRows : ? (default 1)
         * - cw : The width of a cell in px (default 28)
         * - n : ? (default 40)
         * - dim : The size of the list by value (int) or by name
         *
         * byName: {
         *   cursors: ["index"]
         * }
         * byPos: ["arr"]
         * key: "arr"
         * kind: "showArray"
         */

        const fullView = controls.fullView;

        const cellPan = this.getPosition();
        const {byName, byPos} = directive;
        const cursors = (byName.cursors) ? byName.cursors : [];

        const cursorRows = (byName.cursorRows) ? byName.cursorRows : DEFAULT_CURSOR_ROWS;
        const cellHeight = (3 + cursorRows) * TEXT_LINE_HEIGHT + MIN_ARROW_HEIGHT;

        const cellWidth = this._cellWidth = (byName.cw) ? byName.cw : DEFAULT_CELL_WIDTH;

        const maxVisibleCells = (byName.n) ? byName.n : DEFAULT_MAX_VISIBLE_CELLS;

        const {dim} = byName;

        const view: Array1DView = {
            dim,
            cursors,
            cursorRows,
            maxVisibleCells,
            fullView,
            cellHeight,
            cellWidth,
        };
        Object.assign(view, extractView(context, byPos[0], view));
        if (view.error) {
            return <DirectiveFrame {...this.props}>{view.error}</DirectiveFrame>;
        }

        return (
            <DirectiveFrame {...this.props} hasFullView={true}>
                <div className='clearfix' style={{padding: '2px'}}>
                    <SvgPan className='svg-array1d' width='100%' height={cellHeight * scale} scale={scale} x={cellPan * cellWidth - 10} y={0}
                            getPosition={this.getPosition} onPan={this.onPan}>
                        <clipPath id="cell">
                            <rect x="0" y="0" width={cellWidth} height={3 * TEXT_LINE_HEIGHT}/>
                        </clipPath>
                        <g className="array1d">
                            <Grid view={view} cellWidth={cellWidth}/>
                            <g className="cursors">
                                {view.cursorMap.map((cursor, index) =>
                                    <Cursor key={index} view={view} cursor={cursor} />
                                )}
                            </g>
                            <g className="cells">
                                {view.ref.variables.map((cell, index) =>
                                    <Cell key={index} index={index} view={view} />
                                )}
                            </g>
                        </g>
                    </SvgPan>
                </div>
            </DirectiveFrame>
        );
    }

    getPosition = () => {
        return this.props.controls.cellPan;
    };

    onPan = (startPosition, dx) => {
        const cellPan = startPosition - (dx / this._cellWidth);

        this.props.onChange(this.props.directive, {cellPan});
    };
}
