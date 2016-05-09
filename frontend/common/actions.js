
export default function (m) {

// Sent when the application initializes.
m.action('init', 'System.Init')

// Sent when a generic error has occurred.
m.action('error', 'System.Error');

// Switch to the specified screen.
m.action('switchToScreen', 'System.SwitchToScreen');

// TODO: generalize source, input into an editor service

m.action('sourceInit', 'Source.Init');
m.action('sourceEdit', 'Source.Edit');
m.action('sourceSelect', 'Source.Select');
m.action('sourceScroll', 'Source.Scroll');

m.action('inputInit', 'Input.Init');
m.action('inputEdit', 'Input.Edit');
m.action('inputSelect', 'Input.Select');
m.action('inputScroll', 'Input.Scroll');

};
