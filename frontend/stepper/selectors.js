
import {defineSelector} from '../utils/linker';

export default function* () {

  yield defineSelector('getStepperState', state =>
    state.get('stepper')
  );

  yield defineSelector('getStepperOptions', state =>
    state.get('stepper.options')
  );

  yield defineSelector('getStepperDisplay', state =>
    state.getIn(['stepper', 'current'])
  );

  yield defineSelector('getStepperInterrupted', state =>
    state.getIn(['stepper', 'interrupt'])
  );

};
