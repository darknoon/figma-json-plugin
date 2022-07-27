import * as F from "./figma-json";

export default function updateImageHashes(
  n: F.SceneNode,
  updates: Map<string, string>
): F.SceneNode {
  // Shallow copy before modifying,
  // TODO(perf): return same if unmodified
  n = { ...n };

  // fix children recursively
  if ("children" in n && n.children !== undefined) {
    const children = n.children.map((c) => updateImageHashes(c, updates));
    n = { ...n, children };
  }

  const fixFills = (fills: readonly F.Paint[]) => {
    return fills.map((f) => {
      if (f.type === "IMAGE" && typeof f.imageHash === "string") {
        // Always update, sometimes this means nulling the current image, thus preventing an error
        const imageHash = updates.get(f.imageHash) || null;
        if (typeof f.imageHash === "string") {
          return { ...f, imageHash } as F.ImagePaint;
        } else {
          return f;
        }
      } else {
        return f;
      }
    });
  };

  // fix images in fills
  if (
    "fills" in n &&
    n.fills !== undefined &&
    n.fills !== "__Symbol(figma.mixed)__"
  ) {
    n.fills = fixFills(n.fills);
  }

  // fix images in backgrounds
  if ("backgrounds" in n && n.backgrounds !== undefined) {
    n.backgrounds = fixFills(n.backgrounds);
  }

  return n;
}
