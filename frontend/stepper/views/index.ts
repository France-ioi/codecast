import StackBundle from './c/stack';
import {Bundle} from "../../linker";
import {ShowVar as C_ShowVar} from "./c/utils";
import {Array1D as C_Array1D} from "./c/array1d";
import {Array2D as C_Array2D} from "./c/array2d";
import {SortView as C_SortView} from "./c/sort";
import MemoryViewDirective from "./c/memory";
import {Array1D as analysisArray1D} from "../analysis/directives/array1d";
import {Array2D as analysisArray2D} from "../analysis/directives/array2d";
import {SortView as analysisSortView} from "../analysis/directives/sort";

export const directiveDimensionsDict = {
    showArray: (width: number, height: number, props: any) => {
        return {
            taken: {width: 30 * Math.max(10, props.n ? props.n : 0), height: 120},
            minimum: {width: 200, height: 120},
        };
    },
    showArray2D: (width: number, height: number, props: any) => {
        return {
            taken: {width: 100 + 60 * Math.max(3, props.cols ? props.cols : 0), height: 140 + 40 * Math.max(3, props.rows ? props.rows : 0)},
            minimum: {width: 200, height: 220},
        };
    },
    showSort: (width: number, height: number, props: any) => {
        return {
            taken: {width: 30 * Math.max(5, props.dim ? props.dim : 0), height: 240},
            minimum: {width: 300, height: 220},
        };
    },
    showMemory: (width: number, height: number, props: any) => {
        return {
            taken: {width, height: 300},
            minimum: {width: 300, height: 170},
        };
    },
}

export const C_directiveViewDict = {
    showVar: {View: C_ShowVar, selector: obj => obj, snippet: null},
    showArray: {View: C_Array1D, selector: obj => obj, snippet: "//! A = showArray(A, cursors=[i])"},
    showArray2D: {View: C_Array2D, selector: obj => obj, snippet: "//! A = showArray2D(A, rowCursors=[k], colCursors=[j])"},
    showSort: {View: C_SortView, selector: obj => obj, snippet: "//! quicksort = showSort(array, cursors=[left, right, i, j], dim=size, thresholds=[pivot])"},
    showMemory: MemoryViewDirective,
};
export const analysisDirectiveViewDict = {
    showArray: {View: analysisArray1D, selector: obj => obj, snippet: "_VIEW_arr = \"showArray(arr, cursors=[index], cursorRows=20)\""},
    showArray2D: {View: analysisArray2D, selector: obj => obj, snippet: "_VIEW_arr = \"showArray2D(matrix, rowCursors=[line], colCursors=[col], rows=2, cols=3)\""},
    showSort: {View: analysisSortView, selector: obj => obj, snippet: "_VIEW_quicksort= \"showSort(quicksort, cursors=[left, right, i, j], dim=size, thresholds=[pivot])\""},
};

export default function(bundle: Bundle) {
    bundle.include(StackBundle);
};
