'use strict';
const s3BrowserDirectUpload = require('s3-browser-direct-upload');

const s3clientOptions = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
  signatureVersion: 'v4'
};

const s3client = new s3BrowserDirectUpload(s3clientOptions);

module.exports.getMp3UploadForm = function (base, callback) {
  const uploadPostFormOptions = {
    key: `${base}.mp3`,
    extension: 'mp3',
    bucket: process.env.S3_BUCKET,
    acl: 'public-read'
  };
  s3client.uploadPostForm(uploadPostFormOptions, callback);
};

module.exports.getJsonUploadForm = function (base, callback) {
  const uploadPostFormOptions = {
    key: `${base}.json`,
    extension: 'json',
    bucket: process.env.S3_BUCKET,
    acl: 'public-read'
  };
  s3client.uploadPostForm(uploadPostFormOptions, callback);
};
