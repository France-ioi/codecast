
import StackBundle from './stack';
import DirectivesBundle from './directives';

export default function (bundle) {
  bundle.include(StackBundle);
  bundle.include(DirectivesBundle);
};
