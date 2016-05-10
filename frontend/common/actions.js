
import {defineAction} from '../utils/linker';

export default function* () {

  // Sent when the application initializes.
  yield defineAction('init', 'System.Init')

  // Sent when a generic error has occurred.
  yield defineAction('error', 'System.Error');

  // Switch to the specified screen.
  yield defineAction('switchToScreen', 'System.SwitchToScreen');

  // TODO: generalize source, input into an editor service

  yield defineAction('sourceInit', 'Source.Init');
  yield defineAction('sourceEdit', 'Source.Edit');
  yield defineAction('sourceSelect', 'Source.Select');
  yield defineAction('sourceScroll', 'Source.Scroll');

  yield defineAction('inputInit', 'Input.Init');
  yield defineAction('inputEdit', 'Input.Edit');
  yield defineAction('inputSelect', 'Input.Select');
  yield defineAction('inputScroll', 'Input.Scroll');

};
