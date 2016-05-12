
import {addReducer} from '../utils/linker';

export default function* () {

  yield addReducer('switchToScreen', function (state, action) {
    return state.set('screen', action.screen);
  });

};
