import { conditionalReadBlacklist } from "./readBlacklist";
import * as F from "./figma-json";
import {
  saveFigmaState as useFigmaState,
  restoreFigmaState,
} from "./figmaState";

export interface DumpOptions {
  skipInvisibleNodes: boolean;
  images: boolean;
  geometry: "none" | "paths";
  styles: boolean;
  // Depth after which to stop recursing into "children" arrays.
  maxDepth: number;
  childrenReplacement?: F.SceneNode;
}

// Returns true if n is a visible SceneNode or
// not a SceneNode (e.g. a string, number, etc.)
export function isVisible(n: any) {
  if (typeof n !== "object") {
    return true;
  }

  if (
    !("visible" in n) ||
    typeof n.visible !== "boolean" ||
    !("opacity" in n) ||
    typeof n.opacity !== "number" ||
    !("removed" in n) ||
    typeof n.removed !== "boolean"
  ) {
    return true;
  }

  return n.visible && n.opacity > 0.001 && !n.removed;
}

const defaultOptions: DumpOptions = {
  skipInvisibleNodes: true,
  // TODO: Investigate why reading images makes the plugin crash. Otherwise we could have this be true by default.
  images: false,
  geometry: "none",
  styles: false,
  maxDepth: Infinity,
};

type AnyObject = { [name: string]: any };
class DumpContext {
  constructor(public options: DumpOptions) {}

  // Images we need to request and append to our dump
  imageHashes = new Set<string>();
  components: F.ComponentMap = {};
  componentSets: F.ComponentSetMap = {};
  styles: F.StyleMap = {};

  depth = 0;
  pushParent() {
    this.depth++;
  }
  popParent() {
    this.depth--;
  }
}

function _dumpObject(n: AnyObject, keys: readonly string[], ctx: DumpContext) {
  return keys.reduce((o, k) => {
    const v = n[k];
    if (k === "imageHash" && typeof v === "string") {
      ctx.imageHashes.add(v);
    } else if (
      k.endsWith("StyleId") &&
      typeof v === "string" &&
      v.length > 0 &&
      ctx.options.styles
    ) {
      const style = figma.getStyleById(v);

      if (style) {
        ctx.styles[style.id] = {
          key: style.key,
          name: style.name,
          styleType: style.type,
          remote: style.remote,
          description: style.description,
        };
      } else {
        console.warn(`Couldn't find style with id ${v}.`);
      }
    } else if (k === "mainComponent" && v) {
      // If this is a reference to a mainComponent, we want to instead add the componentId
      // ok v should be a component
      const component = v as ComponentNode;
      let componentSetId;
      if (component.parent?.type === "COMPONENT_SET") {
        const componentSet = component.parent as ComponentSetNode;
        const { name, description, documentationLinks, key, remote } =
          componentSet;
        componentSetId = componentSet.id;
        ctx.componentSets[componentSet.id] = {
          key,
          name,
          description,
          remote,
          documentationLinks,
        };
      }
      const { name, key, description, documentationLinks, remote } = component;
      ctx.components[component.id] = {
        key,
        name,
        description,
        remote,
        componentSetId,
        documentationLinks,
      };
      o["componentId"] = v.id;
      return o;
    } else if (k === "children") {
      if (ctx.depth >= ctx.options.maxDepth) {
        if (ctx.options.childrenReplacement) {
          o[k] = [ctx.options.childrenReplacement];
        } else {
          o[k] = [];
        }
      } else {
        ctx.pushParent();
        o[k] = _dump(v, ctx);
        ctx.popParent();
      }
      return o;
    }
    o[k] = _dump(v, ctx);
    return o;
  }, {} as AnyObject);
}
function _dump(n: any, ctx: DumpContext): any {
  switch (typeof n) {
    case "object": {
      if (Array.isArray(n)) {
        return n
          .filter((v) => !ctx.options.skipInvisibleNodes || isVisible(v))
          .map((v) => _dump(v, ctx));
      } else if (n === null) {
        return null;
      } else if (n.__proto__ !== undefined) {
        // Merge keys from __proto__ with natural keys
        const blacklistKeys = conditionalReadBlacklist(n, ctx.options);
        const keys = [...Object.keys(n), ...Object.keys(n.__proto__)].filter(
          (k) => !blacklistKeys.has(k),
        );
        return _dumpObject(n, keys, ctx);
      } else {
        const keys = Object.keys(n);
        return _dumpObject(n, keys, ctx);
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
}

async function requestImages(ctx: DumpContext): Promise<F.ImageMap> {
  const imageRequests = [...ctx.imageHashes].map(async (hash: string) => {
    const im = figma.getImageByHash(hash);
    if (im === null) {
      throw new Error(`Image not found: ${hash}`);
    }
    const dat = await im.getBytesAsync();
    // Tell typescript it's a tuple not an array (fromEntries type error)
    return [hash, dat] as [string, Uint8Array];
  });

  const r = await Promise.all(imageRequests);
  return Object.fromEntries(r);
}

export async function dump(
  n: readonly SceneNode[],
  options: Partial<DumpOptions> = {},
): Promise<F.DumpedFigma> {
  const resolvedOptions: DumpOptions = { ...defaultOptions, ...options };
  const { skipInvisibleNodes } = resolvedOptions;

  // If skipInvisibleNodes is true, skip invisible nodes/their descendants inside *instances*.
  // This only covers instances, and doesn't consider opacity etc.
  // We could filter out these nodes ourselves but it's more efficient when
  // Figma doesn't include them in in the first place.
  useFigmaState(skipInvisibleNodes);

  const ctx = new DumpContext(resolvedOptions);

  const objects = n
    .filter((v) => !skipInvisibleNodes || isVisible(v))
    .map((o) => _dump(o, ctx));

  const images = resolvedOptions.images ? await requestImages(ctx) : {};

  // Reset skipInvisibleInstanceChildren to not affect other code.
  restoreFigmaState();

  const { components, componentSets, styles } = ctx;

  return {
    objects,
    components,
    componentSets,
    styles,
    images,
  };
}
