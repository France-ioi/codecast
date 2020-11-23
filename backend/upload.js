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

// save({accessKeyId, secretAccessKey, region, bucket});

/*
  s3.listObjectVersions({Bucket: bucket}).promise().then(
    function (versions) {
      Object.keys(versions).forEach(function (item) {
        if (item.VersionId) console.log(JSON.stringify(item));
      })
    });
*/

/*

  var params = {
    Bucket: "destinationbucket",
    CopySource: "/sourcebucket/HappyFacejpg",
    Key: "HappyFaceCopyjpg"
  };
  s3.copyObject(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
    // data = {
    //  CopyObjectResult: {
    //   ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
    //   LastModified: <Date Representation>
    //  }
    // }
  });

  var params = {
    Body: <Binary String>,
    Bucket: "examplebucket",
    Key: "exampleobject",
    ServerSideEncryption: "AES256",
    Tagging: "key1=value1&key2=value2"
  };
  s3.putObject(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
    // data = {
    //   ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"",
    //   ServerSideEncryption: "AES256",
    //   VersionId: "Ri.vC6qVlA4dEnjgRV4ZHsHoFIjqEMNt"
    // }
  });

  var params = {
    AccessControlPolicy: {},
    Bucket: "examplebucket",
    GrantFullControl: "emailaddress=user1@example.com,emailaddress=user2@example.com",
    GrantRead: "uri=http://acs.amazonaws.com/groups/global/AllUsers",
    Key: "HappyFace.jpg"
  };
  s3.putObjectAcl(params, function (err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
    // data = {};
  });

*/
