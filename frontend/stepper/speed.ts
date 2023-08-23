import BezierEasing from 'bezier-easing';

export function computeDelayForCurrentStep(delayReference: number, currentStep: number, stepsCount: number): number {
    const initSpeed = delayReference / 2;
    const minSpeed = delayReference / 100;
    const finishSpeed = delayReference;
    const stepsToMinSpeed = 80;
    const stepsToEndMinSpeed = stepsCount - 80;

    // See https://www.desmos.com/calculator/whgklw4liu for the idea of the graph and equations
    // See https://cubic-bezier.com/ for the representation of the Bezier parametric curve and parameters
    const easing = BezierEasing(.14,.38,.62,.99);

    let t = currentStep / stepsToMinSpeed;
    const positionCurveBeginning = initSpeed + easing(t) * (minSpeed - initSpeed);

    t = (currentStep - stepsToEndMinSpeed) / (stepsCount - stepsToEndMinSpeed);
    const positionCurveEnd = finishSpeed + easing(1-t) * (minSpeed - finishSpeed);

    let newDelay;
    if (currentStep <= stepsToMinSpeed && currentStep >= stepsToEndMinSpeed) {
        newDelay = Math.max(positionCurveBeginning, positionCurveEnd);
    } else if (currentStep <= stepsToMinSpeed) {
        newDelay = positionCurveBeginning;
    } else if (currentStep >= stepsToEndMinSpeed) {
        newDelay = positionCurveEnd;
    } else {
        newDelay = minSpeed;
    }

    return newDelay;
}
