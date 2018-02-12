
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
    const {provider} = req.params;
    const {client, config: authConfig} = getOauthConfig(provider);
    const state = req.session.oauth_state;
    client.code.getToken(req.originalUrl, {state})
      .then(function (token) {
        // Save token data in session.
        req.session.provider = provider;
        req.session.token = token.data;
        // Query identity provider with token.
        request(token.sign({method: 'GET', url: authConfig.identityProviderUri}), function (err, response, body) {
          if (err) return res.render('after_login', {error: err.toString()});
          if (response.statusCode != 200) return res.status(response.statusCode).send(body);
          req.session.identity = JSON.parse(body);
          const user = getUser(req.session.identity);
          res.render('after_login', {user});
        });
      })
      .catch(function (err) {
        return res.render('after_login', {error: err.toString()});
      });
  });
  app.get('/logout', function (req, res) {
    const {provider} = req.session;
    const logoutUri = provider && getOauthConfig(provider).config.logoutUri;
    req.session.destroy(function (err) {
      res.render('after_logout', {
        rebaseUrl: config.rebaseUrl,
        logoutUri
      });
    });
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

  function getUser (identity) {
    if (!identity) return false;
    console.log('getUser', JSON.stringify(identity));
    const {id, login} = identity;
    return {id, login};
  }

  config.initHook = function (req, init, callback) {
    let user;
    if ('guest' in req.query) {
      user = {guest: true};
    } else {
      user = getUser(req.session.identity)
    }
    callback(null, {...init, authProviders: Object.keys(config.auth), user});
  };

  config.getUserConfig = function (req, callback) {
    const db = mysql.createConnection(config.database);
    const {identity} = ;
    const {id} = getUser(req.session.identity);
    const q = `SELECT value FROM user_configs WHERE user_id = '${id}' LIMIT 1`;
    db.connect(function (err) {
      if (err) return callback(err);
      db.query(q, function (error, results, fields) {
        if (error || results.length !== 1) {
          db.end();
          return callback('database error');
        }
        let userConfig;
        try {
          userConfig = JSON.parse(results[0].value);
        } catch (ex) {
          db.end();
          return callback('parse error');
        }
        db.end();
        callback(null, userConfig);
      });
    });
  };

  callback(null);

};
