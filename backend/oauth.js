/* TODO: Add endpoint for guest login. */

const mysql = require('mysql');
const ClientOAuth2 = require('client-oauth2');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const request = require('request');
const randomstring = require('randomstring');
const jwt = require("jsonwebtoken");

/*

Schema:

CREATE TABLE user_configs (`user_id` int(11) NOT NULL PRIMARY KEY, `value` TEXT NOT NULL);
ALTER TABLE user_configs ADD UNIQUE INDEX `ix_user_configs_user_id` (`user_id`);

*/

module.exports = function (app, config, callback) {
    const oauthClientCache = {};

    app.set('trust proxy', 1) // trust first proxy

    const store = new MySQLStore(config.database);
    app.use(session({...config.session, store: store}));

    app.get('/auth/:provider', function (req, res) {
        if (req.params.provider === 'guest') {
            return guestUserLogin(req, res);
        }

        const {client} = getOauthConfig(req.params.provider);
        const state = req.session.oauth_state = randomstring.generate();

        res.redirect(client.code.getUri({state}));
    });

    function guestUserLogin(req, res) {
        getUserConfig(0, function (err, userConfig) {
            if (err) return res.render('after_login', {error: err.toString(), rebaseUrl: config.rebaseUrl});

            const user = {
                user_id: 0,
                grants: getFrontEndGrants(userConfig.grants),
            };

            const token = jwt.sign({provider: 'guest', user_id: 0}, config.ownSecret, {expiresIn: '1 year'});

            res.render('after_login', {user, token, rebaseUrl: config.rebaseUrl});
        });
    }

    app.get('/auth/:provider/callback', function (req, res) {
        const {provider} = req.params;
        const {client, config: authConfig} = getOauthConfig(provider);
        const state = req.session.oauth_state;
        client.code.getToken(req.originalUrl, {state})
            .then(function (token) {
                // Save token data in session.
                // Query identity provider with token.
                request(token.sign({
                    method: 'GET',
                    url: authConfig.identityProviderUri
                }), function (err, response, body) {
                    if (err) {
                        return res.render('after_login', {error: err.toString(), rebaseUrl: config.rebaseUrl});
                    }
                    if (response.statusCode !== 200) {
                        return res.status(response.statusCode).send(body);
                    }

                    let identity;
                    try {
                        identity = JSON.parse(body);
                    } catch (ex) {
                        if (err) return res.render('after_login', {error: 'malformed user profile', rebaseUrl: config.rebaseUrl});
                    }

                    if (process.env.NODE_ENV === 'development') {
                        console.log('user_id :', identity.id);
                    }

                    getUserConfig(identity.id, function (err, userConfig) {
                        if (err) {
                            return res.render('after_login', {error: err.toString(), rebaseUrl: config.rebaseUrl});
                        }

                        const user = {
                            user_id: identity.id,
                            grants: getFrontEndGrants(userConfig.grants),
                        };

                        const token = jwt.sign({provider, user_id: identity.id}, config.ownSecret, {expiresIn: '1 year'});

                        res.render('after_login', {user, token, rebaseUrl: config.rebaseUrl});
                    })
                });
            })
            .catch(function (err) {
                return res.render('after_login', {error: err.toString(), rebaseUrl: config.rebaseUrl});
            });
    });

    /**
     * Get the current logged user object.
     */
    app.get('/me', function (req, res) {
        config.getUserConfig(req, async function (err, userConfig) {
            if (err) {
                return res.status(400).json({error: err.toString()});
            }

            res.json({
                user: {
                    user_id: userConfig.user_id,
                    grants: getFrontEndGrants(userConfig.grants),
                },
            });
        });
    });

    function getOauthConfig(provider) {
        let authConfig = config.auth[provider];
        if (!authConfig) {
            throw new Error(`unknown auth provider ${provider}`);
        }

        let client = oauthClientCache[provider];
        if (!client) {
            client = oauthClientCache[provider] = new ClientOAuth2(authConfig.oauth2);
        }

        return {config: authConfig, client};
    }

    /* Return the 'user' object passed to the frontend. */
    function getFrontendUser(session) {
        if (!session.identity) return false;
        const {id, login} = session.identity;
        let grants = [];
        if (session.grants) {
            grants = getFrontEndGrants(session.grants);
        }

        return {id, login, grants};
    }

    function getFrontEndGrants(serverGrants) {
        const grants = [];
        for (let grant of serverGrants) {
            const {type, s3Bucket, s3Region, uploadPath} = grant;

            grants.push({
                description: `s3:${s3Bucket}/${uploadPath}`,
                url: `https://${s3Bucket}.s3.amazonaws.com/${uploadPath}/`,
                type, s3Bucket, s3Region, uploadPath
            });
        }

        return grants;
    }

    config.optionsHook = function (req, options, callback) {
        const authProviders = Object.keys(config.auth);
        authProviders.push('guest');
        callback(null, {...options, authProviders});
    };

    config.getUserConfig = function (req, callback) {
        jwt.verify(req.body.token || req.query.token, config.ownSecret, {}, function (err, token) {
            let userId = 0;
            if (!err && token.user_id) {
                console.log('token', token);
                userId = token.user_id;
            }

            getUserConfig(userId, callback);
        });
    };

    /* Retrieve the local configuration for the given user_id. */
    function getUserConfig(user_id, callback) {
        const db = mysql.createConnection(config.database);
        const grants = [];
        db.connect(function (err) {
            if (err) return done(err);
            queryS3Grants();
        });

        function queryS3Grants() {
            const q = [
                "SELECT * FROM `s3_grants` g, `s3_buckets` b, `s3_access_keys` ak",
                "WHERE `user_id` = ? AND b.`id` = g.`bucket_id` AND b.`access_key_id` = ak.id",
                "ORDER BY `priority` DESC"
            ].join(' ');
            db.query(q, [user_id], function (err, rows) {
                if (err) {
                    if (err.code === 'ER_NO_SUCH_TABLE') {
                        return queryLegacyUserConfig();
                    }

                    return done('database error');
                }
                if (rows.length === 0) {
                    // No grants, fall back to querying legacy user_configs table.
                    return queryLegacyUserConfig();
                }
                for (let row of rows) {
                    grants.push({
                        type: "s3",
                        s3AccessKeyId: row.access_key_id,
                        s3SecretAccessKey: row.secret,
                        s3Region: row.region,
                        s3Bucket: row.bucket,
                        uploadPath: row.path
                    });
                }

                done();
            });
        }

        function queryLegacyUserConfig() {
            const q = "SELECT value FROM user_configs WHERE user_id = ? LIMIT 1";

            db.query(q, [user_id], function (err, rows) {
                if (err) return done('database error ' + err);
                if (rows.length === 1) {
                    try {
                        const grant = JSON.parse(rows[0].value);
                        grant.type = "s3";

                        grants.push(grant);
                    } catch (ex) {
                        return done('parse error');
                    }
                }

                done();
            });
        }

        function done(err) {
            db.end();
            if (err) {
                return callback(err);
            }

            callback(null, {user_id, grants});
        }
    }

    callback(null);
};
