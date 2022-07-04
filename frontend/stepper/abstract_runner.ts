import {StepperContext} from "./api";
import {StepperState} from "./index";

export default abstract class AbstractRunner {
    //TODO: improve this
    public _isFinished: boolean = false;
    public _steps: number = 0;

    constructor(context) {
        context.runner = this;
    }

    public static needsCompilation(): boolean {
        return false;
    }

    public static hasMicroSteps(): boolean {
        return false;
    }

    public enrichStepperContext(stepperContext: StepperContext, state: StepperState): void {
    };

    public isStuck(stepperState: StepperState): boolean {
        return false;
    }

    public async runNewStep(stepperContext: StepperContext, noInteractive = false) {

    }

    // Run inside step without Codecast interaction
    public runStep(quickAlgoCallsExecutor) {

    }

    public initCodes(codes, availableBlocks = null) {

    }

    public onError(e): void {
        console.error(e);
    }

    public isSynchronizedWithAnalysis(analysis): boolean {
        return true;
    }

    public isRunning(): boolean {
        // TODO: implement this if necessary
        return false;
    }

    waitCallback(callback) {
        return (value) => {
            this.noDelay(callback, value);
        };
    }

    noDelay(callback, value) {
        callback(value);
    }
}
