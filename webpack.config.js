const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const SRC = path.resolve(__dirname, "frontend");

const isDev = process.env.NODE_ENV !== 'production';
const jsonConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const publicPath = path.join(process.env.BUILD === 'offline' ? '.' : jsonConfig.mountPath, 'build/');

const config = module.exports = {
  mode: process.env.NODE_ENV,
  resolve: {
    fallback: {
      assert: false,
      fs: false
    },
    alias: {
      lamejs: 'lamejs/src/js/',
      stream: 'stream-browserify'
    },
    extensions: ['.js']
  },
  entry: {
    index: './frontend/index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: publicPath,
    filename: '[name].js'
  },
  devtool: isDev ? 'source-map' : 'eval',
  module: {
    rules: [
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader'
        }
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
            // loader: 'postcss-loader',
            // options: {
            //   plugins: function () {
            //     return [
            //       require('precss'),
            //       require('autoprefixer')
            //     ];
            //   }
            // }
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
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
    //new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    // new webpack.optimize.SplitChunksPlugin({
    //   name: "vendor",
    //   filename: "vendor.js",
    //   minChunks: function (module) {
    //     if (/persistent-c/.test(module.resource)) {
    //       return false;
    //     }
    //     return /node_modules/.test(module.resource);
    //   }
    // })
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: ['process']
    })
  ],
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

/*  Disabled because uglifyjs fails with invalid assignment in vendor.js */
/*
if (!isDev) {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }));
}
*/

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
