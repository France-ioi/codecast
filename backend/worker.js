import {applyMiddleware, createStore} from 'redux';
import {default as sagaMiddlewareFactory} from 'redux-saga';
import {call, take, takeEvery} from 'redux-saga/effects'

import * as upload from './upload';

function reducer(state, action) {
    switch (action.type) {
        case 'INIT':
            state = {};
            break;
    }
    return state;
}

function* mainSaga() {
    yield take('START');
    yield takeEvery('SAVE', saveSaga);
}

function* saveSaga({payload: {target, id, changes, req, res}}) {
    try {
        if (!target) {
            return res.json({error: 'no target'});
        }
        if (!changes) {
            return res.json({error: 'no changes'});
        }
        const {s3Bucket, uploadPath} = target;
        const s3JsonKey = `${uploadPath}/${id}.json`;
        const s3 = upload.makeS3Client(target);
        /* TODO: support updating data: fetch json, apply requested changes, putObject */
        const {Body, VersionId} = yield call(upload.getObject, s3, {Bucket: s3Bucket, Key: s3JsonKey});
        const data = JSON.parse(Body);
        if ('name' in changes) {
            /* name: string */
            data.name = changes.name;
        }
        if ('subtitles' in changes) {
            /* subtitles: [{key: string, text: undefined|string, removed: bool}] */
            const subtitleKeys = [];
            for (let {key: langKey, removed, text} of changes.subtitles) {
                const s3SrtKey = `${uploadPath}/${id}_${langKey}.srt`;
                if (removed) {
                    yield call(upload.deleteObject, s3, s3Bucket, s3SrtKey);
                    continue;
                }
                if (text !== undefined) {
                    yield call(upload.putObject, s3, {
                        Bucket: s3Bucket, Key: s3SrtKey,
                        ACL: 'public-read',
                        ContentType: 'text/plain', Body: text
                    });
                }
                subtitleKeys.push(langKey);
            }
            data.subtitles = subtitleKeys;
        }
        yield call(upload.putObject, s3, {
            Bucket: s3Bucket, Key: `${uploadPath}/${id}.json`,
            ACL: 'public-read',
            ContentType: 'application/json',
            Body: JSON.stringify(data)
        });
        res.json({done: true});
    } catch (ex) {
        res.json({error: ex.toString()});
    }
}

export default function start(options) {
    const sagaMiddleware = sagaMiddlewareFactory();
    const store = createStore(
        reducer,
        null,
        applyMiddleware(sagaMiddleware)
    );
    store.dispatch({type: 'INIT', payload: {options}});
    sagaMiddleware.run(mainSaga);
    return store;
};
