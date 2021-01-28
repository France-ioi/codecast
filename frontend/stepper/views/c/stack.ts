export default function(bundle) {
    bundle.defer(function({stepperApi}) {
        stepperApi.onInit(function(stepperState) {
            stepperState.controls = {
                stack: {
                    focusDepth: 0
                }
            };
        });
    });
};
