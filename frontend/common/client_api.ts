import {buffers, eventChannel} from 'redux-saga';
import {put, take} from 'redux-saga/effects'
import {Bundle} from "../linker";

export default function(bundle: Bundle) {
    const messageChannel = eventChannel(function(listener) {
        const onMessage = function(event) {
            const {source, data} = event;
            let message;
            if (typeof data === 'object') {
                message = data;
            } else if (typeof data === 'string' && data.startsWith('{')) {
                message = JSON.parse(data);
            } else {
                return;
            }
            if (typeof message === 'object') {
                listener({source, message});
            }
        };

        window.addEventListener('message', onMessage);
        return function() {
            window.removeEventListener('message', onMessage);
        };
    }, buffers.expanding(1));

    bundle.addSaga(function* () {
        while (true) {
            let {source, message} = yield take(messageChannel);
            if (typeof message.dispatch === 'object') {
                /* Dispatch an action. */
                yield put(message.dispatch);

            }
        }
    });

}
