import path from 'path';
import jwt from 'jsonwebtoken';
import urlJoin from 'url-join';
import express from 'express';
import editURL from 'edit-url';
import {buildCommonOptions} from './options';

const request = require('request');

export default function (app, config, store) {
    app.use('/offline.zip', express.static(path.join(config.rootDir, 'offline.zip')));

    app.get('/offline', function (req, res) {
        const baseUrl = req.query.recording;

        const manifestUrl = editURL(config.baseUrl, function (obj) {
            obj.pathname = urlJoin(obj.pathname, 'offline/manifest');
            obj.query.recording = baseUrl;
        });

        const builderUrl = editURL(config.builderUrl, function (obj) {
            obj.query.t = jwt.sign({manifestUrl}, config.builderSecret, {issuer: 'codecast', audience: 'builder'});
        });

        res.redirect(builderUrl);
    });

    app.get('/offline/manifest', function (req, res) {
        const {query} = req;
        if (!query.ownPath) {
            query.ownPath = '';
        }
        if (!query.sharedPath) {
            query.sharedPath = '';
        }
        const {ownPath, sharedPath} = query;

        const token = jwt.sign({query}, config.ownSecret, {audience: 'offline'});
        const data = {
            version: '1.0.0',
            contents: [
                {
                    from: {url: `${config.baseUrl}/offline.zip`},
                    to: {unzip: sharedPath},
                },
                {
                    from: {url: `${config.baseUrl}/offline/index?t=${token}`},
                    to: {file: urlJoin(ownPath, 'index.html')},
                },
                {
                    from: {url: `${query.recording}.mp3`},
                    to: {file: urlJoin(ownPath, 'audio.mp3')},
                }
            ]
        };

        res.json(data);
    });

    app.get('/offline/index', function (req, res) {
        jwt.verify(req.query.t, config.ownSecret, {audience: 'offline'}, function (err, token) {
            if (err) {
                return res.status(400).send(err.toString());
            }

            const {query} = token;
            const {ownPath, sharedPath} = query;
            const options = buildCommonOptions(config,'player', query);
            options.audioUrl = urlJoin(pathReverse(sharedPath), ownPath, "audio.mp3");

            request(`${query.recording}.json`, function (err, response, body) {
                if (err) {
                    return res.status(400).send(err.toString());
                }
                if (response.statusCode !== 200) {
                    return res.status(response.statusCode).send(body);
                }

                try {
                    options.data = JSON.parse(body);
                } catch (ex) {
                    return res.status(400).send(ex.toString());
                }

                res.render('offline', {
                    options,
                    baseUrl: `${urlJoin(pathReverse(ownPath), sharedPath)}`
                });
            });
        });
    });
}

function pathReverse(a) {
    if (/^\//.test(a)) {
        return a;
    }

    a = a.replace(/\/*$/, '');
    if (a.length === 0) {
        return '';
    }

    return a.split(/\/+/).map(_ => '..').join('/');
}
