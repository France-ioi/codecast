
import url from 'url';
import {createStore, applyMiddleware} from 'redux';
import {default as sagaMiddlewareFactory, END} from 'redux-saga';
import {all, call, cps, select, put, take, fork, takeEvery, takeLatest, actionChannel} from 'redux-saga/effects'
import aws from 'aws-sdk';

import * as upload from './upload';

function reducer (state, action) {
  switch (action.type) {
  case 'INIT':
    state = {};
    break;
  }
  return state;
}

function* mainSaga () {
  yield take('START');
  yield takeEvery('SAVE', saveSaga);
}

function parseCodecastUrl (base) {
  const {hostname, pathname} = url.parse(base);
  const bucket = hostname.replace('.s3.amazonaws.com', '');
  const idPos = pathname.lastIndexOf('/');
  const uploadPath = pathname.slice(1, idPos); // skip leading '/'
  const id = pathname.slice(idPos + 1);
  return {bucket, uploadPath, id};
}

function* saveSaga ({payload: {userConfig, base, data, req, res}}) {
  try {
    let {bucket, uploadPath, id} = parseCodecastUrl(base);
    if (bucket !== userConfig.s3Bucket || uploadPath !== userConfig.uploadPath) {
      console.log('bucket', bucket, userConfig.s3Bucket);
      console.log('path', uploadPath, userConfig.uploadPath);
      return res.json({error: 'copy not implemented'});
    }
    const {subtitles} = data; /* {key: "en-US", text: "…", removed: true} */
    const subtitlesAvailable = [];
    const s3 = upload.makeS3Client(userConfig);
    for (let {key: langKey, removed, text} of subtitles) {
      const s3Key = `${uploadPath}/${id}_${langKey}.srt`;
      if (removed) {
        yield call(upload.deleteObject, s3, bucket, s3Key);
        continue;
      }
      if (text !== undefined) {
        yield call(upload.putObject, s3, {
          Bucket: bucket, ACL: 'public-read', Key: s3Key,
          ContentType: 'text/plain', Body: text
        });
      }
      subtitlesAvailable.push(langKey);
    }
    yield call(upload.putObject, s3, {
      Bucket: bucket, ACL: 'public-read', Key: `${uploadPath}/${id}.json`,
      ContentType: 'application/json',
      Body: JSON.stringify({...data, subtitles: subtitlesAvailable})
    });
    res.json({done: true});
  } catch (ex) {
    console.log('exception in save saga', ex);
    res.json({error: ex.toString()});
  }
}

export default function start (options) {
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
