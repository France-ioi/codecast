
import s3BrowserDirectUpload from 's3-browser-direct-upload';

export function makeS3Client (options) {
  const s3clientOptions = {
    accessKeyId: options.s3AccessKeyId,
    secretAccessKey: options.s3SecretAccessKey,
    region: options.s3Region,
    signatureVersion: 'v4'
  };
  return new s3BrowserDirectUpload(s3clientOptions);
};


export function getMp3UploadForm (s3client, bucket, base, callback) {
  const uploadPostFormOptions = {
    key: `${base}.mp3`,
    extension: 'mp3',
    bucket: bucket,
    acl: 'public-read'
  };
  s3client.uploadPostForm(uploadPostFormOptions, callback);
};

export function getJsonUploadForm (s3client, bucket, base, callback) {
  const uploadPostFormOptions = {
    key: `${base}.json`,
    extension: 'json',
    bucket: bucket,
    acl: 'public-read'
  };
  s3client.uploadPostForm(uploadPostFormOptions, callback);
};
