'use strict';

const s3BrowserDirectUpload = require('s3-browser-direct-upload');

module.exports.makeS3Client = function (options) {
  const s3clientOptions = {
    accessKeyId: options.s3AccessKeyId,
    secretAccessKey: options.s3SecretAccessKey,
    region: options.s3Region,
    signatureVersion: 'v4'
  };
  return new s3BrowserDirectUpload(s3clientOptions);
};


module.exports.getMp3UploadForm = function (s3client, bucket, base, callback) {
  const uploadPostFormOptions = {
    key: `${base}.mp3`,
    extension: 'mp3',
    bucket: bucket,
    acl: 'public-read'
  };
  s3client.uploadPostForm(uploadPostFormOptions, callback);
};

module.exports.getJsonUploadForm = function (s3client, bucket, base, callback) {
  const uploadPostFormOptions = {
    key: `${base}.json`,
    extension: 'json',
    bucket: bucket,
    acl: 'public-read'
  };
  s3client.uploadPostForm(uploadPostFormOptions, callback);
};
