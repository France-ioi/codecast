const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const SRC = path.resolve(__dirname, "frontend");

const jsonConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const config = module.exports = {
  entry: {
    index: './frontend/index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: path.join(jsonConfig.mountPath, 'build/'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        include: SRC,
        loader: 'babel-loader',
        query: {
          babelrc: true
        }
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.scss$/,
        loader: 'style-loader!css-loader!sass-loader'
      },
      {
        test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
        loader: 'file-loader?name=fonts/[name].[ext]'
      },
      {
        test: /\.(ico|gif|png|jpg|jpeg|svg)$/,
        loader: 'file-loader?context=public&name=images/[name].[ext]'
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
  config.devtool = 'eval'; // inline-source-map
} else {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }));
}
