const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const mainConfig = {
  entry: "./src/main.js",
  target: "electron-main",
  output: {
    path: path.resolve(__dirname, "dist", "app"),
    filename: "main.js",
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
            passes: 2,
          },
          mangle: {
            toplevel: true,
          },
        },
      }),
    ],
  },
};

const preloadConfig = {
  entry: "./src/preload.js",
  target: "electron-preload",
  output: {
    path: path.resolve(__dirname, "dist", "app"),
    filename: "preload.js",
  },
};

const rendererConfig = {
  target: "electron-renderer",
  entry: "./src/renderer.js",
  output: {
    path: path.resolve(__dirname, "dist", "app"),
    filename: "renderer.js",
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
            passes: 2,
          },
          mangle: {
            toplevel: true,
            properties: {
              // Optionally mangle private properties
              regex: /^_/,
            },
          },
        },
      }),
      new CssMinimizerPlugin(),
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "renderer.css",
    }),
    new HtmlWebpackPlugin({
      template: "./src/renderer.html",
      filename: "renderer.html",
      inject: "body", // Changed from false to body
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
  ],
};

module.exports = [mainConfig, preloadConfig, rendererConfig];
