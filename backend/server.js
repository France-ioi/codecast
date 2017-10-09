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
    return `${process.env.BASE_URL}/${url}`;
  }

  app.use(bodyParser.json());

  oauth(app, config, function (err) {
    if (err) return callback('oauth initialization failed');
    addBackendRoutes(app, config);
    callback(null, app);
  });

}

function addBackendRoutes (app, config) {

  app.get('/', function (req, res) {
    res.render('index', {
      development: config.isDevelopment,
      rebaseUrl: config.rebaseUrl,
      options: {start: 'sandbox', baseUrl: process.env.BASE_URL}
    });
  });

  app.get('/recorder', function (req, res) {
    config.initHook(req, {start: 'recorder', baseUrl: process.env.BASE_URL}, function (err, init) {
      if (err) return res.send(`Error: ${err.toString()}`);
      res.render('index', {
        development: config.isDevelopment,
        rebaseUrl: config.rebaseUrl,
        options: init,
      });
    });
  });

  app.get('/player', function (req, res) {
    const audioUrl = `${req.query.base}.mp3`;
    const eventsUrl = `${req.query.base}.json`;
    res.render('index', {
      development: config.isDevelopment,
      rebaseUrl: config.rebaseUrl,
      options: {start: 'player', baseUrl: process.env.BASE_URL, audioUrl, eventsUrl}
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
          const player_url = `${process.env.PLAYER_URL}?base=${encodeURIComponent(baseUrl)}`;
          res.json({player_url, events, audio});
        });
      });
    });
  });

  app.post('/translate', function (req, res) {
    const env = {};
    env.SYSROOT = path.join(rootDir, 'sysroot');
    const {source, mode} = req.body;
    let compiler = './c-to-json.c';
    if (mode === 'arduino') {
      compiler = './c-to-json.c++';
      env.SOURCE_WRAPPER = "wrappers/Arduino";
    }
    const cp = spawn(compiler, {env: env});
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
  buildApp(config, function (err, app) {
    if (err) {
      console.log("app failed to start", err);
      process.exit(1);
    }
    const server = http.createServer(app);
    server.listen(process.env.PORT);
  });
});
