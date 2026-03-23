import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import {viteStaticCopy} from 'vite-plugin-static-copy';
// import legacy from '@vitejs/plugin-legacy';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const jsonConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'))
const bundledFiles = fs.readFileSync('bundled_files.txt', 'utf8')
    .split('\n')
    .filter(line => line.length && line.trim()[0] !== '#')
    .map(file => {
        const fileName = file.includes(':') ? file.split(':')[1] : file

        return {src: fileName.trim(), dest: fileName.substring(0, fileName.lastIndexOf('/'))};
    });

export default defineConfig(({mode}) => {
    const isDev = mode === 'development'
    const isLib = process.env['BUILD'] === 'lib';
    const base = isLib ? './' : jsonConfig.mountPath;

    return {
        base,
        plugins: [
            react({}),
            nodePolyfills({include: ['crypto', 'stream', 'buffer', 'process', 'util', 'fs', 'vm']}),
            ...(!isDev ? [viteStaticCopy({targets: bundledFiles})] : []),
            // ...(isLib ? [] : [legacy({
            //     targets: ['defaults', 'not IE 11'],
            //     modernPolyfills: true,
            //     renderLegacyChunks: true,
            //     // additionalLegacyPolyfills: ['regenerator-runtime/runtime']
            // })]),
        ],
        resolve: {
            alias: {
                lamejs: path.resolve(__dirname, 'node_modules/lamejs/src/js/'),
                stream: 'stream-browserify',
                'react/jsx-runtime.js': 'react/jsx-runtime',
                'react/jsx-dev-runtime.js': 'react/jsx-dev-runtime',
            },
            extensions: ['.tsx', '.ts', '.js'],
        },
        build: {
            outDir: 'build',
            assetsDir: '.',
            sourcemap: false,
            minify: 'terser',
            terserOptions: {compress: {unused: false}},
            assetsInlineLimit: 0, // avoid images inlining
            // ...(isLib ? {
            //     lib: {
            //         entry: {index: path.resolve(__dirname, 'frontend/index.tsx')},
            //         name: 'Codecast',
            //         formats: ['iife'] as const,
            //         cssFileName: 'index',
            //         assetsInlineLimit: 0, // avoid images inlining
            //     },
            // } : {}),
            rollupOptions: {
                input: {index: path.resolve(__dirname, 'frontend/index.tsx')},
                // ...(!isLib ? {input: {index: path.resolve(__dirname, 'frontend/index.tsx')}} : {}),
                output: {
                    format: isLib ? 'iife' : undefined,
                    name: isLib ? 'Codecast' : undefined,
                    entryFileNames: '[name].js',
                    chunkFileNames: '[name].js',
                    assetFileNames: ({name}) => {
                        if (name?.match(/\.(eot|ttf|woff2?)$/)) return 'fonts/[name][extname]'
                        if (name?.endsWith('.css')) return '[name][extname]'
                        return 'images/[name][extname]'
                    },
                    codeSplitting: false,
                },
                onwarn(warning, warn) {
                    if (warning.code === "EVAL") return; // ignore eval warning
                    warn(warning); // default for other warnings
                },
            },
        },
        worker: {
            rollupOptions: {
                output: {entryFileNames: '[name].worker.js'},
            },
        },
        server: {
            allowedHosts: ['lvh.me'],
        },
        css: {
            preprocessorOptions: {
                scss: {
                    quietDeps: true, // Hides deprecation warnings from dependencies
                },
            },
        },
        optimizeDeps: {
            exclude: ['@france-ioi/skulpt'],
        }
    }
})
