
import Immutable from 'immutable';

export default function (m) {

  m.selector('getRecorderState', state =>
    state.get('recorder', Immutable.Map())
  );

};
