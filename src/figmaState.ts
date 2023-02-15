let skipState: boolean | undefined;

export function saveFigmaState() {
  if ("figma" in globalThis) {
    // Capture original value in case we change it.
    skipState = figma.skipInvisibleInstanceChildren;
    // If skipInvisibleNodes is true, skip invisible nodes/their descendants inside *instances*.
    // This only covers instances, and doesn't consider opacity etc.
    // We could filter out these nodes ourselves but it's more efficient when
    // Figma doesn't include them in in the first place.
    figma.skipInvisibleInstanceChildren = true;
  }
}
export function restoreFigmaState() {
  if ("figma" in globalThis && skipState !== undefined) {
    figma.skipInvisibleInstanceChildren = skipState;
    skipState = undefined;
  }
}
