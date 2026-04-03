import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {nodePolyfills} from 'vite-plugin-node-polyfills';
import {viteStaticCopy} from 'vite-plugin-static-copy';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

// Run `npx vite-bundle-visualizer` to see bundle size

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
    const base = isLib ? './' : (isDev ? jsonConfig.mountPath : path.join(jsonConfig.mountPath, 'build/'));
    const target = ['chrome70'];

    return {
        base,
        plugins: [
            react({}),
            // Wait that https://github.com/davidmyersdev/vite-plugin-node-polyfills/pull/149 is merged to get rid of the oxc warning
            nodePolyfills({include: ['crypto', 'stream', 'buffer', 'process', 'util', 'fs', 'vm']}),
            ...(!isDev ? [viteStaticCopy({targets: bundledFiles})] : []),
            // Stub out Blueprint icon path bundles — icon paths are embedded directly in each
            // generated icon component, so the dynamic loader and static allPaths bundle are unneeded.
            // Without this, the IIFE build format inlines all dynamic imports, pulling in ~1MB of icon paths.
            {
                name: 'stub-blueprint-icon-paths',
                load(id) {
                    if (/@blueprintjs\/icons\/lib\/esm\/(allPaths|iconLoader)\.js$/.test(id) ||
                        /@blueprintjs\/icons\/lib\/esm\/paths-loaders\/(allPathsLoader|splitPathsBySizeLoader)\.js$/.test(id) ||
                        /@blueprintjs\/icons\/lib\/esm\/generated\/(16|20)px\/paths\.js$/.test(id)) {
                        return `export const IconSvgPaths16 = {};
export const IconSvgPaths20 = {};
export const getIconPaths = () => undefined;
export class Icons {
    static setLoaderOptions() {}
    static async load() {}
    static async loadAll() {}
    static getPaths() { return undefined; }
    static isValidIconName() { return false; }
}`;
                    }
                    return null;
                },
            },
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
            target,
            outDir: 'build',
            cssCodeSplit: false,
            assetsDir: '.',
            sourcemap: false,
            minify: 'terser',
            assetsInlineLimit: 0, // avoid images inlining
            rollupOptions: {
                input: {index: path.resolve(__dirname, 'frontend/index.tsx')},
                output: {
                    format: 'iife',
                    name: 'Codecast',
                    entryFileNames: '[name].js',
                    assetFileNames: ({name}) => {
                        if (name?.match(/\.(eot|ttf|woff2?)$/)) return 'fonts/[name][extname]'
                        if (name?.endsWith('.css')) return 'index[extname]'
                        return 'images/[name][extname]'
                    },
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
            esbuildOptions: {
                target,
            },
        }
    }
})
