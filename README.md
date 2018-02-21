
# Try it

The most recent production version can be used
[https://codecast.france-ioi.org/v5/](here).

The development version can be tried
[https://codecast.france-ioi.org/v5/](here).
This version can break compatibility with past production releases, that
is, there is no expectation that recordings made on the development
version will remain readable.

# Quick start

Build `c-to-json` and copy the executable at the root of this project.

Copy `config.json.template` to `config.json` and edit it.

If not using oauth2, remove keys "database", "session" and "auth" and
fill in settings in "configs" and "tokens".

If using oauth2, fill in settings in "database", "session" and "auth",
and remove keys "configs" and "tokens".  Use oauth2_schema.sql, and
add rows in user_configs where value is a json object with keys
"s3AccessKeyId", "s3SecretAccessKey", "s3Region", "s3Bucket", and
"uploadPath".  The row with user_id 0 is used for guest settings.

Start with these commands:

    npm install
    npm run build
    npm start

For development "npm run build" is not needed as webpack is configured
to watch the source files:

    NODE_ENV=development npm start
