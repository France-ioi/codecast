import React from 'react';

import {getVariables, renderArrow, renderValue} from './utils';
import {extractView} from './array_utils';
import {SvgPan} from '../../views/SvgPan';
import {DirectiveFrame} from "../../views/DirectiveFrame";
import {StepperControls} from "../../index";
import {CodecastAnalysisVariable} from "../analysis";
import {LayoutDirectiveContext} from '../../../task/layout/LayoutDirective';

const DEFAULT_MAX_VISIBLE_CELLS = 40;
const MARGIN_LEFT = 100;
const MARGIN_TOP = 4;
const MARGIN_BOTTOM = 4;
const BAR_WIDTH = 24;
const BAR_HEIGHT = 100;
const BAR_SPACING = 4;
const BAR_PADDING_BOTTOM = 3;
const BAR_MARGIN_BOTTOM = 2;
const THRESHOLD_MARGIN_RIGHT = 5;
const THRESHOLD_LINE_EXT = 3;
const TEXT_LINE_HEIGHT = 18;
const TEXT_BASELINE = 5;
const MIN_ARROW_HEIGHT = 20;

interface SortViewParams {
    dim: any,
    fullView: any,
    cursors: any,
    maxVisibleCells: any,
    cursorRows: any,
    error?: string,
    thresholds?: any,
    nbCells?: any,
    ref?: any,
    maxValue?: any,
    cursorMap?: any
}

function getValueClass(view, index) {
    const {ref} = view;

    if (ref.variables && ref.variables.length && index in ref.variables && null !== ref.variables[index].previousValue && ref.variables[index].previousValue !== ref.variables[index].value) {
        return 'store';
    }
    if (ref.variables[index].loaded) {
        return 'load';
    }

    return 'default';
}

function Bar({view, index}) {
    const {maxValue, ref} = view;
    const list = ref.variables;
    const cellElement = list[index];

    const w1 = BAR_WIDTH + BAR_SPACING;        // w1: total bar width
    const y1 = BAR_HEIGHT;                    // y1: relative bottom corner of bar rect
    const y5 = y1 + TEXT_LINE_HEIGHT - TEXT_BASELINE + BAR_MARGIN_BOTTOM; // y5: baseline of the index label
    const x0 = MARGIN_LEFT + w1 * index;   // x0: absolute left corner of bar
    const y0 = MARGIN_TOP;                    // y0: absolute top corner of bar
    const x1 = BAR_WIDTH / 2;                 // x1: relative horizontal center of text

    const rectClass = getValueClass(view, index);
    const y3 = y1 - TEXT_BASELINE - BAR_PADDING_BOTTOM;
    const y4 = y3 - TEXT_LINE_HEIGHT;
    const h1 = BAR_HEIGHT * cellElement.value / maxValue; // y3: bar height based on value
    const h2 = (TEXT_LINE_HEIGHT - TEXT_BASELINE) / 3 // strike-through height from line

    let oldElement = null;
    if (ref.variables && ref.variables.length && index in ref.variables) {
        oldElement = ref.variables[index].previousValue;
    }

    return (
        <g className="bar" transform={`translate(${x0},${y0})`}>
            <rect className={rectClass} x="0" y={y1 - h1} width={BAR_WIDTH} height={h1}/>
            <text x={x1} y={y5} className="index">{index}</text>
            <g clipPath="url(#barClipping)">
                {null !== oldElement && (oldElement !== cellElement.value) &&
                <g className="previous-content">
                    <text x={x1} y={y4}>
                        {renderValue(oldElement)}
                    </text>
                    <line x1={2} x2={BAR_WIDTH - 2} y1={y4 - h2} y2={y4 - h2}/>
                </g>
                }
                <text x={x1} y={y3} className="current-content">{renderValue(cellElement.value)}</text>
            </g>
        </g>
    );
}

interface CursorProps {
    key: number,
    view: any,
    cursor: any
}

function Cursor({cursor}: CursorProps) {
    const {labels, col, row} = cursor;
    const h1 = MIN_ARROW_HEIGHT + row * TEXT_LINE_HEIGHT;
    const x0 = MARGIN_LEFT + (BAR_WIDTH + BAR_SPACING) * col;
    const y0 = MARGIN_TOP + BAR_HEIGHT + BAR_MARGIN_BOTTOM + TEXT_LINE_HEIGHT;
    const x1 = BAR_WIDTH / 2;
    const y1 = h1 + TEXT_LINE_HEIGHT - TEXT_BASELINE;

    return (
        <g className="cursor" transform={`translate(${x0},${y0})`}>
            {renderArrow(x1, 0, 'up', 6, h1)}
            <text x={x1} y={y1} className="names">
                {labels.join(',')}
            </text>
        </g>
    );
}

interface ThresholdProps {
    key: number,
    view: any,
    threshold: any
}

function Threshold({view, threshold}: ThresholdProps) {
    const {name, value}: {name: string, value: CodecastAnalysisVariable} = threshold;

    if (!value || !value.value) {
        return null;
    }

    const x0 = MARGIN_LEFT - THRESHOLD_LINE_EXT;
    const x1 = MARGIN_LEFT + (BAR_WIDTH + BAR_SPACING) * view.nbCells + THRESHOLD_LINE_EXT;
    const x2 = MARGIN_LEFT - THRESHOLD_MARGIN_RIGHT;
    const y0 = MARGIN_TOP + BAR_HEIGHT * Number(value.value) / view.maxValue;
    const y1 = y0 + TEXT_BASELINE;

    return (
        <g className="threshold">
            <line x1={x0} x2={x1} y1={y0} y2={y0}/>
            <text x={x2} y={y1}>{name}</text>
        </g>
    );
}

interface SortViewProps {
    controls: StepperControls,
    directive: any,
    context: LayoutDirectiveContext,
    scale: any,
    onChange: Function
}

export class SortView extends React.PureComponent<SortViewProps> {
    render() {
        const {controls, directive, context, scale} = this.props;

        /**
         * Eg. directive :
         *
         * _VIEW_quicksort= "showSort(arr, cursors=[left, right, i, j], dim=size, thresholds=[pivot])"
         *
         * Other options :
         * - cursorRows = ? (default 1)
         * - n = ? (default 40)
         * - dim : The size of the list by value (int) or by name
         *
         * Object return :
         * byName: {
         *   cursors: ["left", "right", "i", "j"],
         *   dim: "size",
         *   thresholds: ["pivot"]
         * }
         * byPos: ["arr"]
         * key: "quicksort"
         * kind: "showSort"
         */

        // Controls
        //   - fullView: read and render all cells
        const fullView = controls.fullView;
        const {byName, byPos} = directive;

        const {dim} = byName;
        const cellPan = this.getPosition();
        const thresholds = (byName.thresholds) ? byName.thresholds : [];
        const cursors = (byName.cursors) ? byName.cursors : [];
        const cursorRows = (byName.cursorRows) ? byName.cursorRows : 1;
        const maxVisibleCells = (byName.n) ? byName.n : DEFAULT_MAX_VISIBLE_CELLS;
        const svgHeight = MARGIN_TOP + BAR_HEIGHT + BAR_MARGIN_BOTTOM + TEXT_LINE_HEIGHT + MIN_ARROW_HEIGHT + TEXT_LINE_HEIGHT * cursorRows + MARGIN_BOTTOM;

        const view: SortViewParams = {
            dim,
            fullView,
            cursors,
            maxVisibleCells,
            cursorRows,
        };
        Object.assign(view, extractView(context, byPos[0], view));
        if (view.error) {
            return <DirectiveFrame {...this.props}>{view.error}</DirectiveFrame>;
        }

        view.thresholds = getVariables(context, thresholds);

        const list = view.ref.variables;
        view.nbCells = list.length;

        // Find the maximum value.
        view.maxValue = list.reduce((currentMax, element) => {
            return Math.max(currentMax, element.value);
        }, 0);

        return (
            <DirectiveFrame {...this.props} hasFullView>
                <div className='clearfix' style={{padding: '2px'}}>
                    <SvgPan className='svg-sortview' width='100%' height={svgHeight * scale} scale={scale} x={cellPan * (BAR_WIDTH + BAR_SPACING) - 10}
                        y={0} getPosition={this.getPosition} onPan={this.onPan}>
                        <clipPath id="barClipping">
                            <rect x="0" y="0" width={BAR_WIDTH} height={BAR_HEIGHT}/>
                        </clipPath>
                        <g className="sort-view">
                            <g className="cursors">
                                {view.cursorMap.map(cursor => <Cursor key={cursor.index} view={view} cursor={cursor} />)}
                            </g>
                            <g className="cells">
                                {list.map((element, index) => <Bar key={index} index={index} view={view}/>)}
                            </g>
                            <g className="thresholds">
                                {view.thresholds.map((threshold, i) => <Threshold key={i} view={view}
                                    threshold={threshold}/>)}
                            </g>
                        </g>
                    </SvgPan>
                </div>
            </DirectiveFrame>
        );
    }

    getPosition = () => {
        return this.props.controls.cellPan ? Number(this.props.controls.cellPan) : 0;
    };

    onPan = (startPosition, dx) => {
        const cellPan = startPosition - (dx / (BAR_WIDTH + BAR_SPACING));
        this.props.onChange(this.props.directive, {cellPan});
    };
}
