const webpack = require("webpack");
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
    {
      ...baseConfig,
      entry: {
        code: "./plugin/code.ts"
      },
      output: {
        ...baseConfig.output,
        filename: "plugin.js"
      },
      plugins: [...baseConfig.plugins]
    },
    {
      ...baseConfig,
      entry: "./src/index.ts",
      output: {
        ...baseConfig.output,
        library: "figmaDump",
        libraryTarget: "var",
        filename: "browser.js"
      }
    },
    {
      ...baseConfig,
      optimization: {
        minimize: false
      },
      entry: "./src/index.ts",
      output: {
        ...baseConfig.output,
        // library: "figmaDump",
        // libraryExport: "figmaDump",
        libraryTarget: "commonjs",
        filename: "main.js"
      }
    }
  ];
};
