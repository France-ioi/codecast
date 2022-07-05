import {StepperContext} from "./api";
import {StepperState} from "./index";

export default abstract class AbstractRunner {
    //TODO: improve this
    public _isFinished: boolean = false;
    public _steps: number = 0;

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

    public async runNewStep(stepperContext: StepperContext) {

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
}
