
export default m => {

  m.selector('getStepperState', state =>
    state.get('stepper')
  );

  m.selector('getTranslateState', state =>
    state.get('translate')
  );

  m.selector('getStepperInterrupted', state =>
    state.getIn(['stepper', 'interrupt'])
  );

  m.selector('StackView', function (state, props) {
    return {state: state.getIn(['stepper', 'display'])};
  });

  m.selector('DirectivesPane', function (state, props) {
    return {state: state.getIn(['stepper', 'display'])};
  });

};
