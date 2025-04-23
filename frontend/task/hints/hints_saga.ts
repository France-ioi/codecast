import {Bundle} from '../../linker';
import {call, put, takeEvery} from 'typed-redux-saga';
import {askCodeHelp} from './hint_actions';
import {changeCodeHelpLoading, hintObtained} from './hints_slice';
import {appSelect} from '../../hooks';
import {selectAnswer} from '../selectors';
import {documentToString} from '../../buffers/document';
import {getCodeHelpHint} from './codehelp';

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* takeEvery(askCodeHelp, function* ({payload: {mode, issue}}) {
            const answer = yield* appSelect(selectAnswer);
            const source = documentToString(answer.document);
            const stepperError = yield* appSelect(state => state.stepper.error);

            yield* put(changeCodeHelpLoading(mode));

            try {
                const hint = yield* call(getCodeHelpHint, {
                    code: source,
                    error: stepperError ? String(stepperError) : null,
                    issue,
                });

                yield* put(hintObtained(hint));
            } catch (e) {
                console.error('An error occurred during platform validation', e);
            } finally {
                yield* put(changeCodeHelpLoading(null));
            }
        });
    });
}
