// Copyright 2019 Andrew Pouliot
export {
  type DumpOptions as Options,
  type DumpOptions,
  isVisible
} from "./read";
export { insert, fontsToLoad } from "./write";

// Expose types for our consumers to interact with
export * from "./figma-json";

export { default as defaultLayers } from "./figma-default-layers";
