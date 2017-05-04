
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

  bundle.defineSelector('getNodeRange', function (state) {
    if (!state) {
      return null;
    }
    const {control} = state.core;
    if (!control || !control.node) {
      return null;
    }
    const focusDepth = state.controls.getIn(['stack','focusDepth'], 0);
    if (focusDepth === 0) {
      return control.node[1].range;
    } else {
      const {frames} = state.analysis;
      const frame = frames.get(frames.size - focusDepth);
      return frame.get('scope').cont.node[1].range;
    }
  });

};
