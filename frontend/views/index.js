
import {include} from '../utils/linker';

import stack from './stack';
import directives from './directives';
import terminal from './terminal';

export default function* () {
  yield include(stack);
  yield include(directives);
  yield include(terminal);
};
