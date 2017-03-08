
import stack from './stack';
import directives from './directives';
import terminal from './terminal';

export default function (bundle) {
  bundle.include(stack);
  bundle.include(directives);
  bundle.include(terminal);
};
