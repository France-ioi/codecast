
import fs from 'fs';
import path from 'path';
import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import {spawn} from 'child_process';
import AnsiToHtml from 'ansi-to-html';
import url from 'url';

import * as upload from './upload';
import directives from './directives';
import Arduino from './arduino';
import oauth from './oauth';
import startWorker from './worker';
import {buildOptions} from './options';
import addOfflineRoutes from './offline';

function buildApp (config, store, callback) {

  const app = express();
  const {rootDir} = config;

  /* Enable strict routing to make trailing slashes matter. */
  app.enable('strict routing');

  /* Default implementations, override these. */
  config.optionsHook = function (req, options, callback) {
    callback(null, options);
  };
  config.getUserConfig = function (req, callback) {
    callback(null, {grants: []});
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
        assets: false,
        cached: false,
        children: false,
        chunks: false,
        chunkGroups: false,
        chunkModules: false,
        chunkOrigins: false,
        colors: true,
        modules: false,
        moduleTrace: false,
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
    addBackendRoutes(app, config, store);
    addOfflineRoutes(app, config, store);
    callback(null, app);
  }
  finalizeApp();
}

function addBackendRoutes (app, config, store) {

  app.get('/', function (req, res) {
    buildOptions(config, req, 'sandbox', function (err, options) {
      res.render('index', {
        development: config.isDevelopment,
        rebaseUrl: config.rebaseUrl,
        options,
      });
    });
  });

  app.get('/player', function (req, res) {
    buildOptions(config, req, 'player', function (err, options) {
      if (err) return res.send(`Error: ${err.toString()}`);
      res.render('index', {
        development: config.isDevelopment,
        rebaseUrl: config.rebaseUrl,
        options,
      });
    });
  });

  app.get('/recorder', function (req, res) {
    buildOptions(config, req, 'recorder', function (err, options) {
      if (err) return res.send(`Error: ${err.toString()}`);
      res.render('index', {
        development: config.isDevelopment,
        rebaseUrl: config.rebaseUrl,
        options,
      });
    });
  });

  app.get('/editor', function (req, res) {
    buildOptions(config, req, 'editor', function (err, options) {
      if (err) return res.send(`Error: ${err.toString()}`);
      res.render('index', {
        development: config.isDevelopment,
        rebaseUrl: config.rebaseUrl,
        options,
      });
    });
  });

  /* Return upload form data.  The query must specify the (s3Bucket, uploadPath)
     pair identifying the S3 target, which must correspond to one of the user's
     grants. */
  app.post('/upload', function (req, res) {
    config.getUserConfig(req, function (err, userConfig) {
      selectTarget (userConfig, req.body, function (err, target) {
        if (err) return res.json({error: err.toString()});
        const s3client = upload.makeS3UploadClient(target);
        const {s3Bucket, uploadPath: uploadDir} = target;
        const id = Date.now().toString();
        const uploadPath = `${uploadDir}/${id}`;
        upload.getJsonUploadForm(s3client, s3Bucket, uploadPath, function (err, events) {
          if (err) return res.json({error: err.toString()});
          upload.getMp3UploadForm(s3client, s3Bucket, uploadPath, function (err, audio) {
            if (err) return res.json({error: err.toString()});
            const baseUrl = `https://${s3Bucket}.s3.amazonaws.com/${uploadPath}`;
            const player_url = `${config.playerUrl}?base=${encodeURIComponent(baseUrl)}`;
            res.json({player_url, events, audio});
          });
        });
      });
    });
  });

  /* Perform the requested `changes` to the codecast at URL `base`.
     The `base` URL must identify an S3 Target in the user's grants. */
  app.post('/save', function (req, res) {
    config.getUserConfig(req, function (err, userConfig) {
      const {s3Bucket, uploadPath, id} = parseCodecastUrl(req.body.base);
      selectTarget (userConfig, {s3Bucket, uploadPath}, function (err, target) {
        if (err) return res.json({error: err.toString()});
        const {changes} = req.body;
        store.dispatch({type: 'SAVE', payload: {target, id, changes, req, res}});
      });
    });
  });

  function selectTarget ({grants}, {s3Bucket, uploadPath}, callback) {
    console.log(grants);
    console.log(s3Bucket, uploadPath);
    for (let grant of grants) {
      if (grant.s3Bucket === s3Bucket && grant.uploadPath === uploadPath) {
        return callback(null, grant);
      }
    }
    return callback('target unspecified');
  }

  function parseCodecastUrl (base) {
    const {hostname, pathname} = url.parse(base);
    const s3Bucket = hostname.replace('.s3.amazonaws.com', '');
    const idPos = pathname.lastIndexOf('/');
    const uploadPath = pathname.slice(1, idPos); // skip leading '/'
    const id = pathname.slice(idPos + 1);
    return {s3Bucket, uploadPath, id};
  }

  app.post('/compile', function (req, res) {
    const env = {LANGUAGE: 'c'};
    env.SYSROOT = path.join(config.rootDir, 'sysroot');
    const {source, platform} = req.body;
    if (platform === 'arduino') {
      env.SOURCE_WRAPPER = "wrappers/Arduino";
      env.LANGUAGE = 'c++';
    }console.log(env);
    const cp = spawn('./c-to-json', {env: env});
    //env.LD_LIBRARY_PATH = path.join(config.rootDir, 'lib');
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
            if (platform === 'arduino') {
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
  config.rootDir = path.resolve(path.dirname(__dirname));
  console.log(`running in ${config.isDevelopment ? 'development' : 'production'} mode`);
  if (!config.playerUrl) {
    config.playerUrl = `${config.baseUrl}/player`;
  }
  const workerStore = startWorker(config);
  buildApp(config, workerStore, function (err, app) {
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
    workerStore.dispatch({type: 'START'});
  });
});

