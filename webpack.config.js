const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const SRC = path.resolve(__dirname, "frontend");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = (env, argv) => {
    if (!argv.mode) {
        argv.mode = 'development';
    }

    process.env.NODE_ENV = argv.mode;
    console.log('process.env.NODE_ENV=', process.env.NODE_ENV);

    const isDev = (argv.mode === 'development');
    if (isDev) {
        process.env.NODE_ENV = 'development';
    } else {
        process.env.NODE_ENV = 'production';
    }

    console.log('isDevelopment ?', isDev);

    const jsonConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const publicPath = path.join(process.env.BUILD === 'offline' ? '.' : jsonConfig.mountPath, 'build/');

    return {
        mode: argv.mode,
        resolve: {
            fallback: {
                assert: false,
                fs: false
            },
            alias: {
                lamejs: 'lamejs/src/js/',
                stream: 'stream-browserify'
            },
            extensions: ['.tsx', '.ts', '.js']
        },
        entry: {
            index: './frontend/index.tsx'
        },
        output: {
            path: path.join(__dirname, 'build'),
            publicPath: publicPath,
            filename: '[name].js'
        },
        devtool: isDev ? 'inline-source-map' : undefined,
        module: {
            rules: [
                {
                    test: /\.worker\.js$/,
                    use: {
                        loader: 'worker-loader'
                    }
                },
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: {
                        transpileOnly: true,
                        experimentalWatchApi: true,
                    },
                },
                {
                    test: /\.js$/,
                    include: SRC,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                babelrc: true
                            }
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    oneOf: [
                        {
                            resourceQuery: /^\?global$/,
                            use: [
                                {
                                    loader: 'style-loader'
                                }, {
                                    loader: 'css-loader',
                                    options: {
                                        modules: false, sourceMap: isDev
                                    }
                                },
                            ]
                        },
                        {
                            use: [
                                {
                                    loader: 'style-loader'
                                }, {
                                    loader: 'css-loader',
                                    options: {
                                        modules: true,
                                        sourceMap: isDev,
                                        importLoaders: 1,
                                        localIdentName: '[name]__[local]___[hash:base64:5]'
                                    }
                                },
                            ]
                        }
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: 'style-loader'
                        }, {
                            loader: 'css-loader',
                            options: {
                                sourceMap: isDev
                            }
                        }, {
                            loader: 'resolve-url-loader'
                        }, {
                            loader: 'sass-loader',
                            options: {
                                sassOptions: {
                                    sourceMap: isDev,
                                    precision: 8
                                }
                            }
                        }
                    ]
                },
                {
                    test: /\.(eot|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                publicPath,
                                name: 'fonts/[name].[ext]'
                            }
                        }
                    ]
                },
                {
                    test: /\.(ico|gif|png|jpg|jpeg|svg)$/,
                    use: [
                        {loader: 'file-loader?context=public&name=images/[name].[ext]'}
                    ]
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
            new webpack.NoEmitOnErrorsPlugin(),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                process: ['process']
            }),
            new ForkTsCheckerWebpackPlugin(),
            // new BundleAnalyzerPlugin(),
        ],
        // Note : splitChunks breaks the audio recording.
        //
        optimization: {
            removeAvailableModules: false,
            removeEmptyChunks: false,
            // splitChunks: false,
            splitChunks: {
        //         cacheGroups: {
        //             commons: {
        //                 test: /[\\/]node_modules[\\/]/,
        //                 name: 'vendors',
        //                 chunks: 'all'
        //             }
        //         }
            }
        },
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
    };
}

require('pretty-error').start();
const oldPrepareStackTrace = Error.prepareStackTrace;
const nodeModulesPath = path.resolve(__dirname, 'node_modules');
Error.prepareStackTrace = function (exc, frames) {
    let hideNodeModules = false;
    frames = frames.filter(function (call_site) {
        const fn = call_site.getFileName();
        if (fn && fn.startsWith(nodeModulesPath)) {
            if (hideNodeModules) {
                return false;
            } else {
                hideNodeModules = true;
                return true;
            }
        }
        return true;
    });
    return oldPrepareStackTrace.call(null, exc, frames);
};
