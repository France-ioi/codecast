import {StepperContext} from "./api";
import {StepperState} from "./index";

export default abstract class AbstractRunner {
    public abstract needsCompilation(): boolean;

    public enrichStepperContext(stepperContext: StepperContext, state: StepperState): void {
    };

    public isStuck(stepperState: StepperState): boolean {
        return false;
    }

    public async runNewStep(stepperContext: StepperContext) {

    }

    public initCodes(codes, availableBlocks = null) {

    }
}
