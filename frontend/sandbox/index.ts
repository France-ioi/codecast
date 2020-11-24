import {SandboxApp} from "./SandboxApp";

export default function (bundle, deps) {
    bundle.defineView('SandboxApp', SandboxAppSelector, SandboxApp);
};

function SandboxAppSelector(state) {
    const {StepperControls, Menu, StepperView} = state.get('scope');
    const containerWidth = state.get('containerWidth');
    const viewportTooSmall = state.get('viewportTooSmall');
    return {
        viewportTooSmall, containerWidth,
        Menu, StepperControls, StepperView
    };
}
