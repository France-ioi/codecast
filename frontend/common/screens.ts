export default function (bundle, deps) {

    // Switch to the specified screen.
    bundle.defineAction('switchToScreen', 'System.SwitchToScreen');

    bundle.addReducer('switchToScreen', function (state, {payload}) {
        return state.set('screen', payload.screen);
    });

};
