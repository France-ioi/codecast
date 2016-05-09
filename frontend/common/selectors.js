
export default function (m) {

  const {getTranslateState, getStepperState} = m.selectors;

  m.selector('getSource', function (state) {
    return state.get('source');
  });

  m.selector('getInput', function (state) {
    return state.get('input');
  });

  m.selector('MainView', function (state, props) {
    const translate = getTranslateState(state);
    const diagnostics = translate && translate.get('diagnostics');
    const stepper = getStepperState(state);
    const haveStepper = !!stepper;
    const stepperState = haveStepper && stepper.get('state');
    const stepperDisplay = haveStepper && stepper.get('display');
    const terminal = haveStepper && stepperDisplay.terminal;
    return {diagnostics, haveStepper, terminal};
  });

};
