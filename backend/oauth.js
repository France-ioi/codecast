
const mysql = require('mysql');
const ClientOAuth2 = require('client-oauth2');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const request = require('request');
const randomstring = require('randomstring');

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
    const {client} = getOauthConfig(req.params.provider);
    const state = req.session.oauth_state = randomstring.generate();
    res.redirect(client.code.getUri({state}));
  });
  app.get('/auth/:provider/callback', function (req, res) {
    const {client, config: authConfig} = getOauthConfig(req.params.provider);
    const state = req.session.oauth_state;
    client.code.getToken(req.originalUrl, {state})
      .then(function (token) {
        // Save token data in session.
        req.session.token = token.data;
        // Query identity provider with token.
        request(token.sign({method: 'GET', url: authConfig.identityProviderUri}), function (error, response, body) {
          if (error) return callback(error);
          req.session.identity = JSON.parse(body);
          res.redirect('/recorder');
        });
      })
      .catch(function (err) {
        return res.send(`authentication failed: ${err.toString()}`);
      });
  });

  config.db = mysql.createConnection(config.database);
  config.db.connect(function (err) {
    if (err) return callback(err);
    // Do stuff
    callback(null);
  });

  function getOauthConfig (provider) {
    let authConfig = config.auth[provider];
    if (!authConfig) {
      throw new Error(`unknown auth provider ${provide}`);
    }
    let client = oauthClientCache[provider];
    if (!client) {
      client = oauthClientCache[provider] = new ClientOAuth2(authConfig.oauth2);
    }
    return {config: authConfig, client};
  }

  config.getUserConfig = function (req, callback) {
    let userConfig = {};
    const {identity} = req.session;
    if (!identity) return callback(null, userConfig);
    const q = `SELECT value FROM user_configs WHERE user_id = '${identity.idUser}' LIMIT 1`;
    config.db.query(q, function (error, results, fields) {
      if (!error && results.length === 1) {
        try {
          userConfig = JSON.parse(results[0].value);
        } catch (ex) {
          userConfig.error = 'parse error';
        }
      }
      callback(null, userConfig);
    });
  };

};
