export default function (bundle) {
    bundle.defineSelector('getPlayerState', state =>
        state.get('player')
    );
};
