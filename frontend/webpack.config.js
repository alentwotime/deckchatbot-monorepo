const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].js',
    publicPath: 'auto',
    clean: true,
  },
  mode: 'production',
  devtool: 'source-map',
  // devServer: { /* your existing config */ },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env','@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader','css-loader']
      }
    ]
  },

  resolve: {
    extensions: ['.js','.jsx'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'),
      assert: require.resolve('assert/'),
      url: require.resolve('url/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      querystring: require.resolve('querystring-es3'),
      fs: false, net: false, tls: false
    }
  },

  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
    new NodePolyfillPlugin(),
    new webpack.IgnorePlugin({ resourceRegExp: /^node:/ }),
    new webpack.IgnorePlugin({ resourceRegExp: /potrace|sqlite3/ }),
    new BundleAnalyzerPlugin({ analyzerMode: 'static', openAnalyzer: false })
  ],

  optimization: {
    splitChunks: { chunks: 'all' },
    runtimeChunk: 'single'
  }
};
