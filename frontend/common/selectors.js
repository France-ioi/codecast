
import {defineSelector} from '../utils/linker';

export default function* () {

  yield defineSelector('getSource', function (state) {
    return state.get('source');
  });

  yield defineSelector('getInput', function (state) {
    return state.get('input');
  });

};
