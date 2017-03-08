
export default function (bundle) {

  bundle.defineSelector('getStepperState', state =>
    state.get('stepper')
  );

  bundle.defineSelector('getStepperOptions', state =>
    state.get('stepper.options')
  );

  bundle.defineSelector('getStepperDisplay', state =>
    state.getIn(['stepper', 'current'])
  );

  bundle.defineSelector('getStepperInterrupted', state =>
    state.getIn(['stepper', 'interrupt'])
  );

};
