const { build } = require("esbuild");
const { dependencies, devDependencies } = require("../package.json");

const entryPoints = ["src/index.ts"];
const settings = {
  entryPoints,
  platform: "node",
  bundle: true,
  external: [...Object.keys(dependencies), ...Object.keys(devDependencies)],
};

const buildESM = () =>
  build({
    ...settings,
    format: "esm",
    outfile: "dist/index.mjs",
  });

const buildCJS = () =>
  build({
    ...settings,
    format: "cjs",
    outfile: "dist/index.js",
  });

const buildAll = () => Promise.all([buildESM(), buildCJS()]);
buildAll();
