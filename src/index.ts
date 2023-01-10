// Copyright 2019 Andrew Pouliot
import * as F from "./figma-json";
import updateImageHashes from "./updateImageHashes";

// Expose types for our consumers to interact with
export * from "./figma-json";

// Anything that is readonly on a SceneNode should not be set!
export const readBlacklist = new Set([
  "parent",
  "removed",
  "stuckNodes",
  "__proto__",
  "id",
  "remote",
  // These are just redundant
  // TODO: make a setting whether to dump things like this
  "hasMissingFont",
  "absoluteTransform",
  "absoluteRenderBounds",
  "vectorNetwork"
]);

// Things in figmaJSON we are not writing right now
export const writeBlacklist = new Set([
  "id",
  "componentPropertyReferences",
  "variantProperties",
  "vectorNetwork"
]);

function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export async function dump(n: readonly SceneNode[]): Promise<F.DumpedFigma> {
  type AnyObject = { [name: string]: any };

  // Images we need to request and append to our dump
  const imageHashes = new Set<string>();

  const _dumpObject = (n: AnyObject, keys: readonly string[]) =>
    keys.reduce((o, k) => {
      const v = n[k];
      if (k === "imageHash" && typeof v === "string") {
        imageHashes.add(v);
      }
      o[k] = _dump(v);
      return o;
    }, {} as AnyObject);

  const _dump = (n: any): any => {
    switch (typeof n) {
      case "object": {
        if (Array.isArray(n)) {
          return n.map((v) => _dump(v));
        } else if (n === null) {
          return null;
        } else if (n.__proto__ !== undefined) {
          // Merge keys from __proto__ with natural keys
          const keys = [...Object.keys(n), ...Object.keys(n.__proto__)].filter(
            (k) => !readBlacklist.has(k)
          );
          return _dumpObject(n, keys);
        } else {
          const keys = Object.keys(n);
          return _dumpObject(n, keys);
        }
      }
      case "function":
        return undefined;
      case "symbol":
        if (n === figma.mixed) {
          return "__Symbol(figma.mixed)__";
        } else {
          return String(n);
        }
      default:
        return n;
    }
  };

  const objects = n.map(_dump);

  const dataRequests = [...imageHashes].map(async (hash: string) => {
    const im = figma.getImageByHash(hash);
    if (im === null) {
      throw new Error(`Image not found: ${hash}`);
    }
    const dat = await im.getBytesAsync();
    // Tell typescript it's a tuple not an array (fromEntries type error)
    return [hash, dat] as [string, Uint8Array];
  });

  const images = Object.fromEntries(await Promise.all(dataRequests));

  return {
    objects,
    images: {}
    // images
  };
}

async function loadFonts(n: F.DumpedFigma): Promise<void> {
  console.log("starting font load...");
  const fontNames = fontsToLoad(n);
  console.log("loading fonts:", fontNames);

  await Promise.all(fontNames.map((f) => figma.loadFontAsync(f)));
  console.log("done loading fonts.");
}

// Format is "Family|Style"
type EncodedFont = string;
// Assume that font never contains "|"
export function encodeFont({ family, style }: FontName): EncodedFont {
  if (family.includes("|") || style.includes("|")) {
    throw new Error(`Cannot encode a font with "|" in the name.`);
  }
  return [family, style].join("|");
}

export function decodeFont(f: EncodedFont): FontName {
  const s = f.split("|");
  if (s.length !== 2) {
    throw new Error(`Unable to decode font string: ${f}`);
  }
  const [family, style] = s;
  return { family, style };
}

export function preflightFonts(
  dump: F.DumpedFigma,
  availableFonts: FontName[]
): {
  requiredFonts: FontName[];
  missingFonts: FontName[];
  usedFonts: FontName[];
} {
  const requiredFonts = fontsToLoad(dump);
  const availableFontsSet = new Set(availableFonts.map(encodeFont));
  const missingFonts = requiredFonts.filter(
    (f) => !availableFontsSet.has(encodeFont(f))
  );
  const usedFonts = requiredFonts.filter((f) =>
    availableFontsSet.has(encodeFont(f))
  );
  return {
    requiredFonts,
    missingFonts,
    usedFonts
  };
}

function resizeOrLog(
  f: LayoutMixin,
  width: number,
  height: number,
  withoutConstraints?: boolean
) {
  if (width > 0.01 && height > 0.01) {
    if (withoutConstraints) {
      f.resizeWithoutConstraints(width, height);
    } else {
      f.resize(width, height);
    }
    // We could check that the size matches after:
    // console.log("size after:", { width: f.width, height: f.height });
  } else {
    const generic = f as SceneNode;
    const { type } = generic;
    console.log(
      `Couldn't resize item: ${JSON.stringify({
        type,
        width,
        height
      })}`
    );
  }
}

export function fontsToLoad(n: F.DumpedFigma): FontName[] {
  // Sets are dumb in JS, can't use FontName because it's an object ref
  // Normalize all fonts to their JSON representation
  const fonts = new Set<string>();

  // Recursive function, searches for fontName to add to set
  const addFonts = (json: F.SceneNode) => {
    switch (json.type) {
      case "COMPONENT":
      case "FRAME":
      case "GROUP":
        const { children = [] } = json;
        children.forEach(addFonts);
        return;
      case "TEXT":
        const { fontName } = json;
        if (typeof fontName === "object") {
          fonts.add(encodeFont(fontName));
        } else if (fontName === "__Symbol(figma.mixed)__") {
          console.log("encountered mixed fontName: ", fontName);
        }
    }
  };

  try {
    n.objects.forEach(addFonts);
  } catch (err) {
    console.error("error searching for fonts:", err);
  }

  const fontNames = [...fonts].map((fstr) => decodeFont(fstr));

  return fontNames;
}

// Any value that is (A | B | PluginAPI["mixed"]) becomes  (A | B | F.Mixed)
type SymbolMixedToMixed<T> = T extends PluginAPI["mixed"]
  ? Exclude<T, PluginAPI["mixed"]> | F.Mixed
  : T;

// Apply said transformation to a Partial<T>
type PartialTransformingMixedValues<T> = {
  [P in keyof T]?: SymbolMixedToMixed<T[P]>;
};

function safeAssign<T>(n: T, dict: PartialTransformingMixedValues<T>) {
  for (let k in dict) {
    try {
      if (writeBlacklist.has(k)) {
        continue;
      }
      const v = dict[k];
      // Bit of a nasty hack here, but don't try to set these mixed sentinels
      if (v === F.MixedValue || v === undefined) {
        continue;
      }
      // Have to cast here, typescript doesn't know how to match these up
      n[k] = v as T[typeof k];
      // console.log(`${k} = ${JSON.stringify(v)}`);
    } catch (error) {
      console.error("assignment failed for key", k, error);
    }
  }
}

function applyPluginData(
  n: BaseNodeMixin,
  pluginData: F.SceneNode["pluginData"]
) {
  if (pluginData === undefined) {
    return;
  }
  Object.entries(pluginData).map(([k, v]) => n.setPluginData(k, v));
}

export async function insert(n: F.DumpedFigma): Promise<SceneNode[]> {
  const offset = { x: 0, y: 0 };
  console.log("starting insert.");

  await loadFonts(n);

  // Create all images
  console.log("creating images.");
  const jsonImages = Object.entries(n.images);
  // TODO(perf): deduplicate same hash => base64 decode => figma
  const hashUpdates = new Map<string, string>();
  const figim = jsonImages.map(([hash, bytes]) => {
    console.log("Adding with hash: ", hash);
    // We can't look up the image by our hash, since figma has a different one
    // const buffer = toByteArray(bytes);
    const im = figma.createImage(bytes);
    // Tell typescript this is a tuple not an array
    hashUpdates.set(hash, im.hash);
    return [hash, im] as [string, Image];
  });

  console.log("updating figma based on new hashes.");
  const objects = n.objects.map((n) => updateImageHashes(n, hashUpdates));

  console.log("inserting.");
  const insertSceneNode = (
    json: F.SceneNode,
    target: BaseNode & ChildrenMixin
  ): SceneNode | undefined => {
    // Using lambdas here to make sure figma is bound as this
    // TODO: experiment whether this is necessary
    const factories = {
      RECTANGLE: () => figma.createRectangle(),
      LINE: () => figma.createLine(),
      ELLIPSE: () => figma.createEllipse(),
      POLYGON: () => figma.createPolygon(),
      STAR: () => figma.createStar(),
      VECTOR: () => figma.createVector(),
      TEXT: () => figma.createText(),
      FRAME: () => figma.createFrame(),
      // Is this a component instance or original component???
      COMPONENT: () => figma.createComponent()

      // Not sceneNodes…
      // createPage(): PageNode;
      // createSlice(): SliceNode;
    };

    const addToParent = (n: SceneNode | undefined) => {
      // console.log("adding to parent", n);
      if (n && n.parent !== target) {
        target.appendChild(n);
      }
    };

    let n;
    switch (json.type) {
      // Handle types with children
      case "FRAME":
      case "COMPONENT": {
        const {
          type,
          children = [],
          width,
          height,
          strokeCap,
          strokeJoin,
          pluginData,
          ...rest
        } = json;
        const f = factories[json.type]();
        addToParent(f);
        resizeOrLog(f, width, height);
        safeAssign(f, rest);
        applyPluginData(f, pluginData);
        // console.log("building children: ", children);
        children.forEach((c) => insertSceneNode(c, f));
        // console.log("applied to children ", f);
        n = f;
        break;
      }
      case "GROUP": {
        const {
          type,
          children = [],
          width,
          height,
          pluginData,
          ...rest
        } = json;
        const nodes = children
          .map((c) => insertSceneNode(c, target))
          .filter(notUndefined);

        const f = figma.group(nodes, target);
        safeAssign(f, rest);
        n = f;
        break;
      }
      case "BOOLEAN_OPERATION": {
        // TODO: this isn't optimal
        const { type, children, width, height, pluginData, ...rest } = json;
        const f = figma.createBooleanOperation();
        safeAssign(f, rest);
        applyPluginData(f, pluginData);
        resizeOrLog(f, width, height);
        n = f;
        break;
      }

      case "RECTANGLE":
      case "ELLIPSE":
      case "LINE":
      case "POLYGON":
      case "VECTOR": {
        const { type, width, height, pluginData, ...rest } = json;
        const f = factories[json.type]();
        safeAssign(
          f,
          rest as Partial<
            RectangleNode & EllipseNode & LineNode & PolygonNode & VectorNode
          >
        );
        applyPluginData(f, pluginData);
        resizeOrLog(f, width, height, true);
        n = f;
        break;
      }

      case "TEXT": {
        const { type, width, height, fontName, pluginData, ...rest } = json;
        const f = figma.createText();
        // Need to assign this first, because of font-loading rules :O
        if (fontName !== "__Symbol(figma.mixed)__") {
          f.fontName = fontName;
        }
        safeAssign(f, rest);
        applyPluginData(f, pluginData);
        resizeOrLog(f, width, height);
        n = f;
        break;
      }

      default: {
        console.log(`element type not supported: ${json.type}`);
        break;
      }
    }
    if (n) {
      target.appendChild(n);
    } else {
      console.warn("Unable to do anything with", json);
    }
    return n;
  };

  return objects
    .map((o) => {
      const n = insertSceneNode(o, figma.currentPage);
      if (n !== undefined) {
        n.x += offset.x;
        n.y += offset.y;
        n.name = `${n.name} Copy`;
      } else {
        console.error("returned undefined for json", o);
      }
      return n;
    })
    .filter(notUndefined);
}
