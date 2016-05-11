
import {defineSelector} from '../utils/linker';

export default function* () {

  yield defineSelector('getPlayerState', state =>
    state.get('player')
  );

};
