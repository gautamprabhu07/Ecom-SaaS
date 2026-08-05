<<<<<<< HEAD
const { NxAppWebpackPlugin } = require("@nx/webpack/app-plugin");
const { join, resolve } = require("path");

module.exports = {
  output: {
    path: join(__dirname, "dist"),
    clean: true,

    ...(process.env.NODE_ENV !== "production"
      ? {
          devtoolModuleFilenameTemplate: "[absolute-resource-path]",
        }
      : {}),
  },

  resolve: {
    alias: {
      "@packages": resolve(__dirname, "../../packages"),
    },
    extensions: [".ts", ".js"],
  },

  plugins: [
    new NxAppWebpackPlugin({
      target: "node",
      compiler: "tsc",
      main: "./src/main.ts",
      tsConfig: "./tsconfig.app.json",
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: "none",
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
=======
const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const {join, resolve} = require('path');

module.exports = {
   output: {
      path: join(__dirname, 'dist'),
   },
   resolve: {
      alias: {
         "@packages": resolve(__dirname, "../../packages"),
      },
      extensions: ['.ts', '.js'],
   },
   plugins: [
      new NxAppWebpackPlugin({
         target: "node",
         compiler: "tsc",
         main: "./src/main.ts",
         tsConfig: "./tsconfig.app.json",
         optimization: false,
         outputHashing: "none",
         generatePackageJson: true,
      }),
   ],
>>>>>>> 8e6f03df1bed8880d94459fa06687a3233806394
};