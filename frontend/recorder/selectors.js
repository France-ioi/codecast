
import Immutable from 'immutable';

import {defineSelector} from '../utils/linker';

export default function* () {

  yield defineSelector('getRecorderState', state =>
    state.get('recorder', Immutable.Map())
  );

};
