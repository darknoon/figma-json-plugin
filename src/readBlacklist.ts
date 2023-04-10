import { Options } from "./index";

// Anything that is readonly on a SceneNode should not be set!
// See notes in figma-json.ts for more details.
export const readBlacklist = new Set([
  "parent",
  "stuckNodes",
  "__proto__",
  "instances",
  "removed",
  "exposedInstances",
  "attachedConnectors",
  "consumers",
  // These are just redundant
  // TODO: make a setting whether to dump things like this
  "hasMissingFont",
  "absoluteTransform",
  "absoluteRenderBounds",
  "absoluteBoundingBox",
  "vectorNetwork",
  "masterComponent",
  // Figma exposes this but plugin types don't support them yet
  "playbackSettings",
  "listSpacing",
  "canUpgradeToNativeBidiSupport",
  // Deprecated but Figma still exposes it
  "horizontalPadding",
  "verticalPadding",
]);

const _tooManyPoints = ["fillGeometry", "strokeGeometry"];
const _relativeTransformEtc = ["size", "relativeTransform"];
const _backgrounds = ["backgrounds", "backgroundStyleId"];
const _defaultBlacklist = new Set([
  ...readBlacklist,
  "componentPropertyDefinitions",
]);
const _defaultBlacklistNoBackgrounds = new Set([
  ..._defaultBlacklist,
  ..._backgrounds,
]);

const _noGeometryBlacklist = new Set([..._defaultBlacklist, ..._tooManyPoints]);
const _noGeometryNoBackgroundsBlacklist = new Set([
  ..._noGeometryBlacklist,
  ..._backgrounds,
]);

const _okToReadDefsWithGeomBlacklist = new Set([
  ...readBlacklist,
  ..._backgrounds,
]);
const _okToReadDefsNoGeomBlacklist = new Set([
  ...readBlacklist,
  ..._tooManyPoints,
  ..._backgrounds,
]);
const _textLayerNoGeomBlacklist = new Set([
  ..._defaultBlacklistNoBackgrounds,
  ..._tooManyPoints,
  ..._relativeTransformEtc,
]);

const _textLayerWithGeomBlacklist = new Set([
  ..._tooManyPoints,
  ..._defaultBlacklistNoBackgrounds,
]);

function isOkToReadBackgrounds(n: any) {
  return "type" in n && n.type === "PAGE";
}

export function conditionalReadBlacklistSimple(
  n: any,
  options: Pick<Options, "geometry">,
) {
  let conditionalBlacklist = new Set([...readBlacklist]);

  // Only read componentPropertyDefinitions if n is a
  // non-variant component or a component set to avoid errors.
  const okToReadDefs =
    "type" in n &&
    (n.type === "COMPONENT_SET" ||
      (n.type === "COMPONENT" &&
        (!n.parent || n.parent.type !== "COMPONENT_SET")));
  if (!okToReadDefs) {
    conditionalBlacklist.add("componentPropertyDefinitions");
  }

  if (!isOkToReadBackgrounds(n)) {
    conditionalBlacklist.add("backgrounds");
    conditionalBlacklist.add("backgroundStyleId");
  }

  // Ignore geometry keys if geometry is set to "none"
  // Copied these keys from the Figma REST API.
  // "size" represents width/height of elements and is different
  // from the width/height of the bounding box:
  // https://www.figma.com/developers/api#frame-props
  if (options.geometry === "none") {
    conditionalBlacklist = new Set([
      ...conditionalBlacklist,
      "fillGeometry",
      "strokeGeometry",
      "size",
      "relativeTransform",
    ]);
  } else if ("type" in n && n.type === "TEXT") {
    // Never include text outline geometry
    conditionalBlacklist = new Set([
      ...conditionalBlacklist,
      "fillGeometry",
      "strokeGeometry",
    ]);
  }

  return conditionalBlacklist;
}

export function conditionalReadBlacklist(
  n: any,
  options: Pick<Options, "geometry">,
) {
  // Only read componentPropertyDefinitions if n is a
  // non-variant component or a component set to avoid errors.
  const okToReadDefs =
    "type" in n &&
    (n.type === "COMPONENT_SET" ||
      (n.type === "COMPONENT" &&
        (!n.parent || n.parent.type !== "COMPONENT_SET")));

  const ignoreGeometry = options.geometry === "none";
  const isTextLayer = "type" in n && n.type === "TEXT";

  if (isTextLayer) {
    if (ignoreGeometry) {
      return _textLayerNoGeomBlacklist;
    } else {
      return _textLayerWithGeomBlacklist;
    }
  } else if (okToReadDefs) {
    if (ignoreGeometry) {
      return _okToReadDefsNoGeomBlacklist;
    } else {
      return _okToReadDefsWithGeomBlacklist;
    }
  } else if (isOkToReadBackgrounds(n)) {
    if (ignoreGeometry) {
      return _noGeometryBlacklist;
    } else {
      return _defaultBlacklist;
    }
  } else {
    if (ignoreGeometry) {
      return _noGeometryNoBackgroundsBlacklist;
    } else {
      return _defaultBlacklistNoBackgrounds;
    }
  }
}
