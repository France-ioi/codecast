import StackBundle from './c/stack';
import {Bundle} from "../../linker";
import {ShowVar as C_ShowVar} from "./c/utils";
import {Array1D as C_Array1D} from "./c/array1d";
import {Array2D as C_Array2D} from "./c/array2d";
import {SortView as C_SortView} from "./c/sort";
import MemoryViewDirective from "./c/memory";
import {Array1D as pythonArray1D} from "./python/array1d";
import {Array2D as pythonArray2D} from "./python/array2d";
import {SortView as pythonSortView} from "./python/sort";

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
    showVar: {View: C_ShowVar, selector: obj => obj},
    showArray: {View: C_Array1D, selector: obj => obj},
    showArray2D: {View: C_Array2D, selector: obj => obj},
    showSort: {View: C_SortView, selector: obj => obj},
    showMemory: MemoryViewDirective,
};
export const pythonDirectiveViewDict = {
    showArray: {View: pythonArray1D, selector: obj => obj},
    showArray2D: {View: pythonArray2D, selector: obj => obj},
    showSort: {View: pythonSortView, selector: obj => obj},
};

export default function(bundle: Bundle) {
    bundle.include(StackBundle);
};
