
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

function* saveSaga ({payload: {userConfig, base, changes, req, res}}) {
  try {
    let {bucket, uploadPath, id} = parseCodecastUrl(base);
    /* TODO: support multiple values for buckets, uploadPath */
    if (bucket !== userConfig.s3Bucket || uploadPath !== userConfig.uploadPath) {
      console.log('bucket', bucket, userConfig.s3Bucket);
      console.log('path', uploadPath, userConfig.uploadPath);
      return res.json({error: 'denied'});
    }
    if (!changes) {
      return res.json({error: 'no changes requested'});
    }
    const s3JsonKey = `${uploadPath}/${id}.json`;
    const s3 = upload.makeS3Client(userConfig);
    /* TODO: support updating data: fetch json, apply requested changes, putObject */
    const {Body, VersionId} = yield call(upload.getObject, s3, {Bucket: bucket, Key: s3JsonKey});
    console.log('VersionId', VersionId);
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
          yield call(upload.deleteObject, s3, bucket, s3SrtKey);
          continue;
        }
        if (text !== undefined) {
          yield call(upload.putObject, s3, {
            Bucket: bucket, Key: s3SrtKey,
            ACL: 'public-read',
            ContentType: 'text/plain', Body: text
          });
        }
        subtitleKeys.push(langKey);
      }
      data.subtitles = subtitleKeys;
    }
    console.log("putObject", JSON.stringify(data));
    yield call(upload.putObject, s3, {
      Bucket: bucket, Key: `${uploadPath}/${id}.json`,
      ACL: 'public-read',
      ContentType: 'application/json',
      Body: JSON.stringify(data)
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
