const webpack = require("webpack");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = (env, argv) => {
  const baseConfig = {
    mode: argv.mode === "production" ? "production" : "development",
    devtool: false,
    module: {
      rules: [{ test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ }]
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
        new HtmlWebpackInlineSourcePlugin()
      ]
    }
  ];
};
