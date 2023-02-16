let skipState: boolean | undefined;

export function saveFigmaState(skipInvisibleInstanceChildren: boolean) {
  if ("figma" in globalThis) {
    // Capture original value in case we change it.
    skipState = figma.skipInvisibleInstanceChildren;
    figma.skipInvisibleInstanceChildren = skipInvisibleInstanceChildren;
  }
}
export function restoreFigmaState() {
  if ("figma" in globalThis && skipState !== undefined) {
    figma.skipInvisibleInstanceChildren = skipState;
    skipState = undefined;
  }
}
