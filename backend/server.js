'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const spawn = require('child_process').spawn;
const rootDir = path.resolve(path.dirname(__dirname));
const app = express();

const upload = require('./upload');

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

app.get('/upload.json', function (req, res) {
  upload.getJsonUploadForm('uploads/1', function (err, form) {
    // if (err) ...
    res.render('upload', form);
  });
});

app.get('/upload.mp3', function (req, res) {
  upload.getMp3UploadForm('uploads/1', function (err, form) {
    // if (err) ...
    res.render('upload', form);
  });
});

app.post('/upload', function (req, res) {
  const id = '1';
  const base = `uploads/${id}`;
  upload.getJsonUploadForm(base, function (err, events) {
    // if (err) ...
    upload.getMp3UploadForm(base, function (err, audio) {
      // if (err) ...
      res.json({events: events, audio: audio});
    });
  });
});

app.post('/translate', function (req, res) {
  const source = req.body.source;
  // int main () { return 1; }
  const cp = spawn('./c-to-json');
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
      try {
        const ast = JSON.parse(chunks.join(''));
        res.json({ast: ast});
      } catch (err) {
        res.json({error: err.toString()});
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
