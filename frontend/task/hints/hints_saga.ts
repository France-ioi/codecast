import {Bundle} from '../../linker';
import {call, put, takeEvery} from 'typed-redux-saga';
import {askCodeHelp} from './hint_actions';
import {
    changeCodeHelpDetailEnabled,
    changeCodeHelpIssue,
    changeCodeHelpLoading,
    hintObtained,
    TaskHint
} from './hints_slice';
import {appSelect} from '../../hooks';
import {selectAnswer} from '../selectors';
import {documentToString} from '../../buffers/document';
import {getCodeHelpHint} from './codehelp';
import {stepperDisplayError} from '../../stepper/actionTypes';
import {ActionTypes as CommonActionTypes} from '../../common/actionTypes';
import {getMessage} from '../../lang';
import {LibraryTestResult} from '../libs/library_test_result';

export default function (bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* takeEvery(askCodeHelp, function* ({payload: {mode, issue}}) {
            const answer = yield* appSelect(selectAnswer);
            const source = documentToString(answer.document);
            const stepperError = yield* appSelect(state => state.stepper.error);

            yield* put(changeCodeHelpLoading(mode));

            try {
                const hint: TaskHint = yield* call(getCodeHelpHint, {
                    code: source,
                    error: LibraryTestResult.getMessage(stepperError),
                    issue,
                });

                yield* put(hintObtained(hint));
                yield* put(changeCodeHelpIssue(''));
                yield* put(changeCodeHelpDetailEnabled(false));
            } catch (e) {
                console.error('An error occurred during platform validation', e);
                yield* put(stepperDisplayError(getMessage('HINTS_CODE_HELP_ERROR').s));
                yield* put({
                    type: CommonActionTypes.AppSwitchToScreen,
                    payload: {screen: null},
                });
            } finally {
                yield* put(changeCodeHelpLoading(null));
            }
        });
    });
}
