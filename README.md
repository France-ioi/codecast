# Codecast

## Try it

The most recent production version can be used
[here](https://codecast.france-ioi.org/v5/).

The development version can be tried
[here](https://codecast.france-ioi.org/next/).
This version can break compatibility with past production releases, that
is, there is no expectation that recordings made on the development
version will remain readable.

[Python documentation](docs/python.md)


## Setup

Get the current version of `c-to-json` to the root of this project. You can retrieve the last compiled version (linux) like so:

```
curl -O https://codecast.france-ioi.org/next/c-to-json
chmod +x c-to-json
sudo apt-get install libncurses5
```

## Configuration

Copy `config.json.template` to `config.json` and edit it.

If not using HTTPS, set session.cookie.secure to false.

If not using oauth2, set "auth" to `{}`: you'll be able to use the guest mode only.

### AWS S3 bucket

To be able to store recordings and play them, you'll need an AWS S3 bucket.

Create an AWS account and then a S3 bucket.

In the "Permissions" section of your bucket, setup this CORS configuration:

```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": []
    }
]
```

In the "Permissions" section of your bucket, you'll also want to edit "block public access" and disable blocking all public access.

Then generate AWS credentials in "My Security Credentials" > "Access keys" and use these credentiels to fill in the `config.json` file.

### Database

Create a local MySQL database and import the file `db_schema.sql` into it.
Add rows in `user_configs` where value is a json object with keys
"s3AccessKeyId", "s3SecretAccessKey", "s3Region", "s3Bucket", and
"uploadPath".  The row with user_id 0 is used for guest settings.

Fill the `config.json` file with your database credentials.

### Old documentation

1. setup codecast-examples project and proxy it
to '/examples' also install a cors plugin in your browser to get rid of cors issues.

2. when login in for the first time in development, check the console log for the user_id, which you need to add the db row for the user, that's mentioned above

3. for uploading your own codecast for your dev setup, use "/dev-upload" url, add in backend/server.js, instructions are in there


## Install project and run

To install and run the project, or after an update, run:

    git submodule update --init
    yarn install
    yarn dev

To build the project for production use, run:

    git submodule update --init
    yarn install
    yarn build
    yarn start


## Offline use

1 : Build the offline ZIP :
```
    rm -rf build
    yarn run build-offline
    zip -r offline.zip build assets
```

2 : Install and configure [archive-builder](https://github.com/France-ioi/archive-builder)

3 : Fill the configuration in /config.json

- **builderUrl** is the URL of the archive-builder you installed in the previous step.
- **builderSecret** is the builder secret.
- **ownSecret** A secret string you can generate with :
```javascript
node -e 'console.log(require("crypto").randomBytes(32).toString("base64"))'
```

## Developers additional documentation

Documentation for linker : https://github.com/epixode/epic-linker
