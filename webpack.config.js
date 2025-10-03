const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const mainConfig = {
  entry: './src/main.js',
  target: 'electron-main',
  output: {
    path: path.resolve(__dirname, 'dist', 'app'),
    filename: 'main.js'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  optimization: {
    minimizer: [new TerserPlugin({
      terserOptions: {
        compress: {
          drop_console: false,
        }
      }
    })]
  }
};

const preloadConfig = {
  entry: './src/preload.js',
  target: 'electron-preload',
  output: {
    path: path.resolve(__dirname, 'dist', 'app'),
    filename: 'preload.js'
  }
};

const rendererConfig = {
  target: 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist', 'app')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer.html',
      filename: 'renderer.html',
      inject: false,
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true
      }
    })
  ]
};

module.exports = [mainConfig, preloadConfig, rendererConfig];
