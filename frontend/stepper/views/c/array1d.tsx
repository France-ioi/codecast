import React from 'react';
import classnames from 'classnames';

import {getList, getNumber, renderArrow, renderValue} from './utils';
import {extractView} from './array_utils';
import {SvgPan} from '../SvgPan';
import {DirectiveFrame} from "../DirectiveFrame";
import {StepperControls} from "../../index";

// @11px, line height 15, offset 12
const textLineHeight = 18;
const textBaseline = 5; // from bottom
const arrowWidth = 6;
const minArrowHeight = 20;

interface Array1DView {
    dimExpr: any,
    cursorExprs: any,
    cursorRows: any,
    maxVisibleCells: any,
    fullView: any,
    cellHeight: any,
    cellWidth: any,
    error?: string,
    cursorMap?: any,
    ref?: any,
    cells?: any
}

function baseline(i) {
    return textLineHeight * (i + 1) - textBaseline;
}

function getCellClasses(cell, cursor) {
    const {content} = cell;
    if (content) {
        if (content.store !== undefined)
            return "cell cell-store";
        if (content.load !== undefined)
            return "cell cell-load";
    }
    if (cursor)
        return "cell cell-cursor";
    return "cell";
}

function Grid({cells, cursorMap, cellWidth}) {
    const elements = [];
    // Column labels and horizontal lines
    const y1 = textLineHeight * 1;
    const y2 = textLineHeight * 2;
    const y3 = baseline(2);
    for (let i = 0, x = 0; i < cells.length; i += 1, x += cellWidth) {
        const cell = cells[i];
        const cursor = cursorMap[cell.index];
        const cellClasses = getCellClasses(cell, cursor);
        elements.push(
            <g key={`h${i}`}>
                {!cell.gap && <text x={x + cellWidth / 2} y={y3} className="index">{cell.index}</text>}
                <rect x={x} y={y1} width={cellWidth} height={textLineHeight} className={cellClasses}/>
                <line x1={x} x2={x + cellWidth} y1={y1} y2={y1} className={classnames(['h', 't', cell.gap && 'gap'])}/>
                <line x1={x} x2={x + cellWidth} y1={y2} y2={y2} className={classnames(['h', 'b', cell.gap && 'gap'])}/>
            </g>
        );
    }
    // Vertical lines
    for (let i = 0, x = 0; i <= cells.length; i += 1, x += cellWidth) {
        elements.push(<line key={`v${i}`} x1={x} x2={x} y1={y1} y2={y2} className="v"/>);
    }
    return <g className="grid">{elements}</g>;
}

function Cell({view, cell}) {
    if (cell.gap) {
        return null;
    }
    const {cellWidth} = view;
    const {position, content} = cell;
    const y0 = baseline(0);
    const y0a = y0 - (textLineHeight - textBaseline) / 3;
    const y1 = baseline(1);
    return (
        <g transform={`translate(${position * cellWidth},0)`} clipPath="url(#cell)">
            {content && 'previous' in content &&
            <g className="previous-content">
                <text x={cellWidth / 2} y={y0}>
                    {renderValue(content.previous)}
                </text>
                <line x1={2} x2={cellWidth - 2} y1={y0a} y2={y0a}/>
            </g>}
            <text x={cellWidth / 2} y={y1} className="current-content">
                {content && renderValue(content.current)}
            </text>
        </g>
    );
}

function Cursor({view, cursor}) {
    const {cellWidth} = view;
    const {labels, col, row} = cursor;
    const arrowTop = textLineHeight * 3;
    const arrowHeight = minArrowHeight + row * textLineHeight;
    const cursorsY = baseline(3) + arrowHeight;
    return (
        <g transform={`translate(${col * cellWidth},0)`}>
            {renderArrow(cellWidth / 2, arrowTop, 'up', arrowWidth, arrowHeight)}
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
    _cellWidth = 28;

    render() {
        const {controls, directive, context, scale} = this.props;
        const topStackFrame = null; // functionCallStack[0];
        const fullView = controls.fullView;
        const cellPan = this.getPosition();
        const {byName, byPos} = directive;
        const expr = byPos[0];
        const cursorExprs = getList(byName.cursors, []);
        const cursorRows = getNumber(byName.cursorRows, 1);
        const cellHeight = (3 + cursorRows) * textLineHeight + minArrowHeight;
        const cellWidth = this._cellWidth = getNumber(byName.cw, 28);
        const maxVisibleCells = getNumber(byName.n, 40);
        const {dim} = byName;
        // The first element of `functionCallStack` is the topmost stackFrame containing the  directive.
        const view: Array1DView = {
            dimExpr: dim, cursorExprs, cursorRows, maxVisibleCells,
            fullView, cellHeight, cellWidth,
        };
        Object.assign(view, extractView(context, topStackFrame, expr, view));
        if (view.error) {
            return <DirectiveFrame {...this.props}>{view.error}</DirectiveFrame>;
        }
        return (
            <DirectiveFrame {...this.props} hasFullView>
                <div className='clearfix' style={{padding: '2px'}}>
                    <SvgPan className='svg-array1d' width='100%' height={cellHeight * scale} scale={scale} x={cellPan * cellWidth - 10} y={0}
                        getPosition={this.getPosition} onPan={this.onPan}>
                        <clipPath id="cell">
                            <rect x="0" y="0" width={cellWidth} height={3 * textLineHeight}/>
                        </clipPath>
                        <g className="array1d">
                            <Grid cells={view.cells} cursorMap={view.cursorMap} cellWidth={cellWidth}/>
                            <g className="cursors">
                                {view.cursorMap.map(cursor => <Cursor key={cursor.index} view={view} cursor={cursor}/>)}
                            </g>
                            <g className="cells">
                                {view.cells.map(cell => <Cell key={cell.index} view={view} cell={cell}/>)}
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
