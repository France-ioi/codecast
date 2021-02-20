import {initialStepperStateControls, StepperState} from "../../index";
import {Bundle} from "../../../linker";
import {App} from "../../../index";

export default function(bundle: Bundle) {
    bundle.defer(function({stepperApi}: App) {
        stepperApi.onInit(function(stepperState: StepperState) {
            stepperState.controls = initialStepperStateControls;
        });
    });
};
