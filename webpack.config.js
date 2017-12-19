const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const SRC = path.resolve(__dirname, "frontend");

const jsonConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const publicPath = path.join(jsonConfig.mountPath, 'build/');

const config = module.exports = {
  entry: {
    index: './frontend/index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: publicPath,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: SRC,
        use: [
          {loader: 'babel-loader', options: {babelrc: true}}
        ]
      },
      {
        test: /\.css$/,
        use: [
          {loader: 'style-loader'},
          {loader: 'css-loader'}
        ]
      },
      {
        test: /\.scss$/,
        use: [
          {loader: 'style-loader'},
          {loader: 'css-loader'},
          {loader: 'resolve-url-loader'},
          {loader: 'sass-loader', options: {sourceMap: true}}
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
        use: [
          {loader: 'file-loader', options: {publicPath, name: 'fonts/[name].[ext]'}}
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
  resolve: {
    extensions: ['.js'],
    alias: {
      'lamejs': 'lamejs/src/js/'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: "vendor.js",
      minChunks: function (module) {
        if (/persistent-c/.test(module.resource)) {
          return false;
        }
        return /node_modules/.test(module.resource);
      }
    })
  ]
};

if (process.env.NODE_ENV !== 'production') {
  // config.devtool = 'eval';
  // config.devtool = inline-source-map;
  config.devtool = 'inline-source-map';
} else {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }));
}
