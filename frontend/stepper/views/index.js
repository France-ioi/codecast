
import MainBundle from './main';
import StackBundle from './stack';
import DirectivesBundle from './directives';

export default function (bundle) {
  bundle.include(MainBundle);
  bundle.include(StackBundle);
  bundle.include(DirectivesBundle);
};
