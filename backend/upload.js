import aws from 'aws-sdk';
import s3BrowserDirectUpload from 's3-browser-direct-upload';

export function makeS3UploadClient(options) {
    const s3clientOptions = {
        accessKeyId: options.s3AccessKeyId,
        secretAccessKey: options.s3SecretAccessKey,
        region: options.s3Region,
        signatureVersion: 'v4'
    };

    return new s3BrowserDirectUpload(s3clientOptions);
}

export function getMp3UploadForm(s3client, bucket, base, callback) {
    const uploadPostFormOptions = {
        key: `${base}.mp3`,
        extension: 'mp3',
        bucket: bucket,
        acl: 'public-read'
    };

    s3client.uploadPostForm(uploadPostFormOptions, callback);
}

export function getJsonUploadForm(s3client, bucket, base, callback) {
    const uploadPostFormOptions = {
        key: `${base}.json`,
        extension: 'json',
        bucket: bucket,
        acl: 'public-read'
    };

    s3client.uploadPostForm(uploadPostFormOptions, callback);
}

export function makeS3Client({s3AccessKeyId, s3SecretAccessKey, s3Region}) {
    return new aws.S3({
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
        region: s3Region
    });
}

export function getObject(s3, params) {
    return s3.getObject(params).promise();
}

export function putObject(s3, params) {
    return s3.putObject(params).promise();
}

export function deleteObject(s3, bucket, key) {
    const params = {
        Bucket: bucket,
        Delete: {
            Objects: [{Key: key}],
        },
    };

    return s3.deleteObjects(params).promise();
}
