'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn;
const rootDir = path.resolve(path.dirname(__dirname));
const app = express();
const AnsiToHtml = require('ansi-to-html');

const upload = require('./upload');
const directives = require('./directives');

app.set('view engine', 'jade');
app.set('views', path.join(rootDir, 'backend', 'views'));

const isDevelopment = process.env.NODE_ENV !== 'production';
console.log(`running in ${isDevelopment ? 'development' : 'production'} mode`);

const staticAssets = {
  jspm_packages: {},
  src: {
    enabled: isDevelopment,
    path: 'frontend'
  },
  assets: {}
};
Object.keys(staticAssets).forEach(function (key) {
  const options = staticAssets[key];
  if ('enabled' in options && !options.enabled) {
    return;
  }
  const urlPath = '/' + key;
  let fullPath = 'path' in options ? options.path : key;
  if (!fullPath.startsWith('/')) {
    fullPath = path.join(rootDir, fullPath)
  }
  console.log('static', urlPath, fullPath);
  app.use(urlPath, express.static(fullPath));
});

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.render('index', {development: isDevelopment});
});

app.get('/player', function (req, res) {
  res.render('player', {development: isDevelopment});
});

app.post('/upload', function (req, res) {
  const id = Date.now().toString();
  const base = `uploads/${id}`;
  upload.getJsonUploadForm(base, function (err, events) {
    // if (err) ...
    upload.getMp3UploadForm(base, function (err, audio) {
      // if (err) ...
      res.json({id: id, events: events, audio: audio});
    });
  });
});

app.post('/translate', function (req, res) {
  const env = {};
  Object.assign(env, process.env);
  env.SYSROOT = path.join(rootDir, 'sysroot');
  const source = req.body.source;
  const cp = spawn('./c-to-json', {env: env});
  const chunks = [];
  const errorChunks = [];
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
    if (err) {
      errorSent = true;
      res.json({error: err.toString()});
    } else {
      cp.stdin.end();
    }
  });
  let errorSent = false;
  cp.on('close', function (code) {
    if (errorSent)
      return;
    if (code === 0) {
      if (chunks.length === 0) {
        const convert = new AnsiToHtml();
        res.json({diagnostics: convert.toHtml(errorChunks.join(''))});
      } else {
        try {
          const ast = JSON.parse(chunks.join(''));
          const convert = new AnsiToHtml();
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

// Creating the server in plain or TLS mode (TLS mode is the default)
const options = {
  key: fs.readFileSync(path.join(rootDir, 'config/server.key')),
  cert: fs.readFileSync(path.join(rootDir, 'config/server.crt'))
};
const server = https.createServer(options, app);
server.listen(process.env.HTTP2_PORT || 8001);
