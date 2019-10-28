// Copyright 2019 Andrew Pouliot
import { fromEntries } from "./polyfill";
import { FigmaJSON as F } from "ca-to-layershot";
import { fromByteArray, toByteArray } from "base64-js";

// Anything that is readonly on a SceneNode should not be set!
export const readBlacklist = new Set([
  "parent",
  "removed",
  "__proto__",
  "id",
  "absoluteTransform",
  "hasMissingFont"
]);

// Things in figmaJSON we are not writing right now
export const writeBlacklist = new Set(["id"]);

function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export async function dump(n: readonly SceneNode[]): Promise<F.DumpedFigma> {
  type AnyObject = { [name: string]: any };

  // Images we need to request and append to our dump
  const imageHashes = new Set<string>();

  const _dumpObject = (n: AnyObject, keys: readonly string[]) =>
    keys.reduce(
      (o, k) => {
        const v = n[k];
        if (k === "imageHash" && typeof v === "string") {
          imageHashes.add(v);
        }
        o[k] = _dump(v);
        return o;
      },
      {} as AnyObject
    );

  const _dump = (n: any): any => {
    switch (typeof n) {
      case "object": {
        if (Array.isArray(n)) {
          return n.map(v => _dump(v));
        } else if (n.__proto__ !== undefined) {
          // Merge keys from __proto__ with natural keys
          const keys = [...Object.keys(n), ...Object.keys(n.__proto__)].filter(
            k => !readBlacklist.has(k)
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
    const dat = await im.getBytesAsync();
    const base64 = fromByteArray(dat);
    // Tell typescript it's a tuple not an array (fromEntries type error)
    return [hash, base64] as [string, F.Base64String];
  });

  const images = fromEntries(await Promise.all(dataRequests));

  return {
    objects,
    images: {}
    // images
  };
}

async function loadFonts(n: F.DumpedFigma): Promise<void> {
  console.log("starting font load...");
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
          fonts.add(JSON.stringify(fontName));
        } else {
          console.log("encountered fontName symbol: ", fontName);
        }
    }
  };

  console.log("searching objects...");

  try {
    n.objects.forEach(addFonts);
  } catch (err) {
    console.log("error searching for fonts:");
  }

  // There seems to be a bug when we don't await any fonts…b
  const addl = { family: "SF Pro Text", style: "Regular" };
  const fontNames = [...fonts, JSON.stringify(addl)].map(
    fstr => JSON.parse(fstr) as FontName
  );
  console.log("loading fonts:", fontNames);

  await Promise.all(fontNames.map(f => figma.loadFontAsync(f)));
  console.log("done loading fonts.");
}

function safeAssign<T>(n: T, dict: Partial<T>) {
  for (let k in dict) {
    try {
      const v = dict[k];
      // I can't quite figure out how to get typescript to accept that if k is in dict
      const dictForceTS = dict as Required<T>;
      n[k] = dictForceTS[k];
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
  Object.entries(pluginData).map(([k, v]) => n.setPluginData(k, v));
}

export async function insert(n: F.DumpedFigma): Promise<SceneNode[]> {
  const offset = { x: 0, y: 0 };
  console.log("starting insert.");

  await loadFonts(n);

  // Create all images
  console.log("creating images.");
  const imt = Object.entries(n.images);
  const figim = imt.map(([hash, base64]) => {
    let im: Image = figma.getImageByHash(hash);
    if (!im) {
      console.log("creating image: ", im);
      const buffer = toByteArray(base64);
      im = figma.createImage(buffer);
    } else {
      console.log("have image: ", im);
    }
    // Tell typescript this is a tuple not an array
    return [hash, im] as [string, Image];
  });
  const loadedImages = fromEntries(figim);

  const insertSceneNode = (
    json: F.SceneNode,
    target: BaseNode & ChildrenMixin
  ): SceneNode | undefined => {
    console.log("in insertSceneNode with type", json.type);
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
      console.log("adding to parent", n);
      if (n && n.parent !== target) {
        target.appendChild(n);
      }
    };

    let n;
    switch (json.type) {
      // Handle types with children
      case "FRAME":
      case "COMPONENT": {
        const { type, children, width, height, pluginData, ...rest } = json;
        const f = factories[json.type]();
        addToParent(f);
        console.log("size target:", { width, height });
        f.resize(width, height);
        console.log("size after:", { width: f.width, height: f.height });
        safeAssign(f, rest);
        applyPluginData(f, pluginData);
        console.log("building children: ", children);
        children.forEach(c => insertSceneNode(c, f));
        console.log("applied to children ", f);
        n = f;
        break;
      }
      case "GROUP": {
        const { type, children, width, height, pluginData, ...rest } = json;
        const nodes = children
          .map(c => insertSceneNode(c, target))
          .filter(notUndefined);

        console.log("created objects", nodes);
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
        f.resizeWithoutConstraints(width, height);
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
        safeAssign(f, rest);
        applyPluginData(f, pluginData);
        f.resizeWithoutConstraints(width, height);
        n = f;
        break;
      }

      case "TEXT": {
        const { type, width, height, fontName, pluginData, ...rest } = json;
        const f = figma.createText();
        // Need to assign this first, because of font-loading rules :O
        f.fontName = fontName;
        console.log("assigning in text", rest);
        safeAssign(f, rest);
        applyPluginData(f, pluginData);
        console.log("resizing in text");
        // f.resize(width, height);
        n = f;
        break;
      }

      default: {
        console.log(`element type not supported: ${json.type}`);
        break;
      }
    }
    if (n) {
      console.log("appending child", n);
      target.appendChild(n);
    } else {
      console.log("Unable to do anything with", json);
    }
    return n;
  };

  console.log("n.objects", n.objects);

  return n.objects
    .map(o => {
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
