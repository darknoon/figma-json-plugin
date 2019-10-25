import { fromEntries } from "./polyfill";

// Anything that is readonly on a SceneNode should not be set!
export const blacklist = new Set([
  "parent",
  "removed",
  "__proto__",
  "id",
  "absoluteTransform",
  "hasMissingFont"
]);

export interface DumpedFigma {
  objects: SceneNode[];
  images: { [hash: string]: Uint8Array };
}

function notUndefined<T>(x: T | undefined): x is T {
  return x !== undefined;
}

export async function dump(n: readonly SceneNode[]): Promise<DumpedFigma> {
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
            k => !blacklist.has(k)
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

  const dataRequests = [...imageHashes].map(async hash => {
    const im = figma.getImageByHash(hash);
    const dat = await im.getBytesAsync();
    // Tell typescript it's a tuple not an array (fromEntries type error)
    return [hash, dat] as [string, Uint8Array];
  });

  const images = fromEntries(await Promise.all(dataRequests));

  return {
    objects,
    images
  };
}

async function loadFonts(n: DumpedFigma): Promise<void> {
  // Sets are dumb in JS, can't use FontName because it's an object ref
  // Normalize all fonts to their JSON representation
  const fonts = new Set<string>();

  // Recursive function, searches for fontName to add to set
  const addFonts = (json: SceneNode) => {
    switch (json.type) {
      case "COMPONENT":
      case "FRAME":
      case "GROUP":
        const { children } = json;
        children.map(addFonts);
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

  n.objects.forEach(addFonts);

  const fontNames = [...fonts].map(fstr => JSON.parse(fstr) as FontName);
  console.log("loading fonts:", fontNames);

  await Promise.all(fontNames.map(f => figma.loadFontAsync(f)));
  console.log("done loading fonts.");
}

export async function insert(n: DumpedFigma): Promise<SceneNode[]> {
  const offset = { x: 300, y: 300 };

  await loadFonts(n);

  // Create all images
  console.log("creating images.");
  const imt = Object.entries(n.images);
  const figim = imt.map(([hash, buffer]) => {
    let im: Image = figma.getImageByHash(hash);
    if (!im) {
      console.log("creating image: ", im);
      im = figma.createImage(buffer);
    } else {
      console.log("have image: ", im);
    }
    // Tell typescript this is a tuple not an array
    return [hash, im] as [string, Image];
  });
  const loadedImages = fromEntries(figim);

  const insertSceneNode = (
    json: SceneNode,
    target: ChildrenMixin
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

    let n;
    switch (json.type) {
      // Handle types with children
      case "FRAME":
      case "COMPONENT": {
        const { type, children, width, height, ...rest } = json;
        const f = factories[json.type]();
        f.resizeWithoutConstraints(width, height);
        Object.assign(f, rest);
        children.forEach(c => insertSceneNode(c, f));
        n = f;
        break;
      }
      case "BOOLEAN_OPERATION": {
        // TODO: this isn't optimal
        const { type, children, width, height, ...rest } = json;
        const f = figma.createBooleanOperation();
        Object.assign(f, rest);
        f.resizeWithoutConstraints(width, height);
        n = f;
        break;
      }

      case "RECTANGLE":
      case "ELLIPSE":
      case "LINE":
      case "POLYGON":
      case "VECTOR": {
        const { type, width, height, ...rest } = json;
        const f = factories[json.type]();
        f.resizeWithoutConstraints(width, height);
        Object.assign(f, rest);
        n = f;
        break;
      }

      case "TEXT": {
        const { type, width, height, ...rest } = json;
        const f = figma.createText();
        f.resizeWithoutConstraints(width, height);
        Object.assign(f, rest);
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
