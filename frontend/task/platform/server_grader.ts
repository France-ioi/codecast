import {getAnswerTokenForLevel, getTaskTokenForLevel} from "./task_token";
import {call, select} from "typed-redux-saga";
import {PlatformTaskGradingParameters, serverApi} from "./platform";
import {AppStore} from "../../store";
import stringify from 'json-stable-stringify-without-jsonify';
import {appSelect} from '../../hooks';

// This will be used when we'll start the task grading by a server
export class ServerGrader {
    *gradeAnswer({level, answer, minScore, maxScore, noScore}: PlatformTaskGradingParameters) {
        const randomSeed = yield* appSelect(state => state.platform.taskRandomSeed);

        const newTaskToken = getTaskTokenForLevel(level, randomSeed);
        const answerToken = getAnswerTokenForLevel(stringify(answer), level, randomSeed);

        const {score, message, scoreToken}: any = yield* call(serverApi, 'tasks', 'gradeAnswer', {
            task: newTaskToken,
            answer: answerToken,
            min_score: minScore,
            max_score: maxScore,
            no_score: noScore,
        });

        return {score, message, scoreToken};
    }
}
