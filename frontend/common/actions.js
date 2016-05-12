
import {defineAction} from '../utils/linker';

export default function* () {

  // Sent when the application initializes.
  yield defineAction('init', 'System.Init')

  // Sent when a generic error has occurred.
  yield defineAction('error', 'System.Error');

  // Switch to the specified screen.
  yield defineAction('switchToScreen', 'System.SwitchToScreen');

};
