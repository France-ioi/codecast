'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn;
const rootDir = path.resolve(path.dirname(__dirname));
const AnsiToHtml = require('ansi-to-html');


const upload = require('./upload');
const directives = require('./directives');
const Arduino = require('./arduino');
const oauth = require('./oauth');

function buildApp (config, callback) {

  const app = express();

  // Default implementations
  config.initHook = function (req, init, callback) {
    callback(null, init);
  };
  config.getUserConfig = function (req, callback) {
    let {token} = req.query;
    if (token === undefined) {
      token = 'default';
    }
    const {configs, tokens} = config;
    if (!(token in tokens)) {
      return callback('bad token');
    }
    const result = {};
    tokens[token].forEach(function (item) {
      if (typeof item === 'object') {
        Object.assign(result, item);
      } else if (typeof item === 'string') {
        Object.assign(result, configs[item]);
      }
    });
    callback(null, result);
  };

  app.set('view engine', 'pug');
  app.set('views', path.join(rootDir, 'backend', 'views'));

  if (config.isDevelopment) {
    // Development route: /build is managed by webpack
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackConfig = require('../webpack.config.js');
    const compiler = webpack(webpackConfig);
    app.use('/build', webpackDevMiddleware(compiler, {
      stats: {
        colors: true,
        chunks: false
      }
    }));
  } else {
    // Production route: /build serves static files in build/
    app.use('/build', express.static(path.join(rootDir, 'build')));
  }

  /* Serve static assets. */
  app.use('/assets', express.static(path.join(rootDir, 'assets')));
  config.rebaseUrl = function (url) {
    return `${config.baseUrl}/${url}`;
  }

  app.use(bodyParser.json());

  /* Enable OAuth2 authentification only if the database is configured. */
  if (config.database) {
    return oauth(app, config, function (err) {
      if (err) return callback('oauth initialization failed');
      finalizeApp();
    });
  }

  function finalizeApp () {
    addBackendRoutes(app, config);
    callback(null, app);
  }
  finalizeApp();
}

function addBackendRoutes (app, config) {

  app.get('/', function (req, res) {
    res.render('index', {
      development: config.isDevelopment,
      rebaseUrl: config.rebaseUrl,
      options: {start: 'sandbox', baseUrl: config.baseUrl}
    });
  });

  app.get('/recorder', function (req, res) {
    config.initHook(req, {start: 'recorder', baseUrl: config.baseUrl}, function (err, init) {
      if (err) return res.send(`Error: ${err.toString()}`);
      res.render('index', {
        development: config.isDevelopment,
        rebaseUrl: config.rebaseUrl,
        options: init,
      });
    });
  });

  app.get('/editor', function (req, res) {
    config.initHook(req, {start: 'editor', baseUrl: config.baseUrl}, function (err, init) {
      if (err) return res.send(`Error: ${err.toString()}`);
      res.render('index', {
        development: config.isDevelopment,
        rebaseUrl: config.rebaseUrl,
        options: init
      });
    });
  });

  app.get('/editor.json', function (req, res) {
    config.getUserConfig(req, function (err, userConfig) {
      if (err) return res.json({error: err.toString()});
      const {s3Bucket, uploadPath} = userConfig;
      const baseDataUrl = `https://${s3Bucket}.s3.amazonaws.com/${uploadPath}/`;
      res.json({baseDataUrl});
    });
  });

  app.get('/player', function (req, res) {
    const baseDataUrl = req.query.base;
    res.render('index', {
      development: config.isDevelopment,
      rebaseUrl: config.rebaseUrl,
      options: {start: 'player', baseUrl: config.baseUrl, baseDataUrl}
    });
  });

  app.post('/upload', function (req, res) {
    config.getUserConfig(req, function (err, userConfig) {
      if (err) return res.json({error: err});
      const id = Date.now().toString();
      const uploadPath = `${userConfig.uploadPath||'uploads'}/${id}`;
      const bucket = userConfig.s3Bucket;
      const s3client = upload.makeS3Client(userConfig);
      upload.getJsonUploadForm(s3client, bucket, uploadPath, function (err, events) {
        if (err) return res.json({error: err.toString()});
        upload.getMp3UploadForm(s3client, bucket, uploadPath, function (err, audio) {
          if (err) return res.json({error: err.toString()});
          const baseUrl = `https://${bucket}.s3.amazonaws.com/${uploadPath}`;
          const player_url = `${config.playerUrl}?base=${encodeURIComponent(baseUrl)}`;
          res.json({player_url, events, audio});
        });
      });
    });
  });

  app.post('/translate', function (req, res) {
    const env = {LANGUAGE: 'c'};
    env.SYSROOT = path.join(rootDir, 'sysroot');
    const {source, mode} = req.body;
    if (mode === 'arduino') {
      env.SOURCE_WRAPPER = "wrappers/Arduino";
      env.LANGUAGE = 'c++';
    }
    const cp = spawn('./c-to-json', {env: env});
    //env.LD_LIBRARY_PATH = path.join(rootDir, 'lib');
    const chunks = [];
    const errorChunks = [];
    let errorSent = false;
    cp.stdout.on('data', function (chunk) {
      chunks.push(chunk);
    });
    cp.stderr.on('data', function (chunk) {
      errorChunks.push(chunk);
    });
    cp.stdin.on('error', function (err) {
      errorSent = true;
      res.json({error: err.toString()});
    });
    cp.stdin.write(source, function (err) {
      if (err) return;
      cp.stdin.end();
    });
    cp.on('close', function (code) {
      if (errorSent)
        return;
      if (code === 0) {
        if (chunks.length === 0) {
          const convert = new AnsiToHtml();
          res.json({diagnostics: convert.toHtml(errorChunks.join(''))});
        } else {
          try {
            let ast = JSON.parse(chunks.join(''));
            const convert = new AnsiToHtml();
            if (mode === 'arduino') {
              ast = Arduino.transform(ast);
            }
            directives.enrichSyntaxTree(source, ast);
            res.json({ast: ast, diagnostics: convert.toHtml(errorChunks.join(''))});
          } catch (err) {
            res.json({error: err.toString()});
          }
        }
      } else {
        res.json({error: errorChunks.join('')});
      }
    });
    cp.on('error', function (err) {
      errorSent = true;
      res.json({error: err.toString()});
    });

  });

}

fs.readFile('config.json', 'utf8', function (err, data) {
  if (err) return res.json({error: err.toString()});
  const config = JSON.parse(data);
  config.isDevelopment = process.env.NODE_ENV !== 'production';
  console.log(`running in ${config.isDevelopment ? 'development' : 'production'} mode`);
  if (!config.playerUrl) {
    config.playerUrl = `${config.baseUrl}/player`;
  }
  buildApp(config, function (err, app) {
    if (err) {
      console.log("app failed to start", err);
      process.exit(1);
    }
    if (config.mountPath) {
      console.log(`mounting app at ${config.mountPath}`);
      const rootApp = express();
      rootApp.use(config.mountPath, app);
      app = rootApp;
    }
    const server = http.createServer(app);
    server.listen(config.port);
  });
});
