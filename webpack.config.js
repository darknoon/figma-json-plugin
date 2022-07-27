const webpack = require("webpack");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = (env, argv) => {
  const baseConfig = {
    mode: argv.mode === "production" ? "production" : "development",
    devtool: false,
    externals: {
      react: "React",
      "react-dom": "ReactDOM"
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          include: [
            path.resolve(__dirname, "src"),
            path.resolve(__dirname, "plugin"),
            path.resolve(__dirname, "../utils/"),
            path.resolve(__dirname, "../figma-json/"),
            path.resolve(__dirname, "../../src/")
          ]
        }
      ]
    },
    resolve: { extensions: [".tsx", ".ts", ".jsx", ".js"] },
    output: {
      path: path.resolve(__dirname, "dist")
    },
    plugins: [new webpack.EnvironmentPlugin(["NODE_ENV"])]
  };

  return [
    // Output the plugin and UI code
    {
      ...baseConfig,
      entry: {
        ui: "./plugin/ui.tsx", // The entry point for your UI code
        plugin: "./plugin/plugin.ts"
      },
      output: {
        ...baseConfig.output,
        filename: "[name].js"
      },
      plugins: [
        ...baseConfig.plugins,
        new HtmlWebpackPlugin({
          template: "./plugin/ui.html",
          filename: "ui.html",
          inlineSource: ".(js)$",
          chunks: ["ui"]
        }),
        new Dotenv({
          path: "../../.env"
        }),
        new HtmlWebpackInlineSourcePlugin()
      ]
    }
  ];
};
