import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const generateWebFormS3URL = async (s3client, event) => {
    const command = new PutObjectCommand({
        Bucket: event.bucket,
        Key: event.key,
        ACL: event.acl,
        ContentType: event.contentType,
    });

    return await getSignedUrl(s3client, command, {expiresIn: 360});
};

export function makeS3Client(target) {
    return new S3Client({
        region: target.s3Region,
        credentials: {
            accessKeyId: target.s3AccessKeyId,
            secretAccessKey: target.s3SecretAccessKey,
        }
    });
}

export async function getFileUploadForm(s3client, bucket, fileName) {
    const uploadPostFormOptions = {
        key: fileName,
        bucket: bucket,
        acl: 'public-read',
    };

    return await generateWebFormS3URL(s3client, uploadPostFormOptions);
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
