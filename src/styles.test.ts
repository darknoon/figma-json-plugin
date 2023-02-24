import { createFigma } from "figma-api-stub";

import * as F from "./figma-json";
import { dump } from ".";

// Technically doesn't test remote styles right now
beforeEach(() => {
  (globalThis as any).figma = createFigma({});
});

function getStyleKey(styleId: string): string {
  const startIndex = styleId.indexOf(":") + 1;
  const endIndex = styleId.lastIndexOf(",");

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Invalid style id: ${styleId}`);
  }

  return styleId.substring(startIndex, endIndex);
}

function createStyles() {
  const paintStyle = figma.createPaintStyle();
  paintStyle.name = "backgroundPrimary";
  paintStyle.description = "Primary background color";
  (paintStyle as { key: string }).key = getStyleKey(paintStyle.id);

  const effectStyle = figma.createEffectStyle();
  effectStyle.name = "Below / Low";
  effectStyle.description = "Default shadow";
  (effectStyle as { key: string }).key = getStyleKey(effectStyle.id);

  const gridStyle = figma.createGridStyle();
  gridStyle.name = "Layout grid / Baseline";
  gridStyle.description = "Grid for baseline alignment";
  (gridStyle as { key: string }).key = getStyleKey(gridStyle.id);

  const textStyle = figma.createTextStyle();
  textStyle.name = "Display / Large";
  textStyle.description = "Large display text";
  (textStyle as { key: string }).key = getStyleKey(textStyle.id);

  return {
    paintStyle,
    effectStyle,
    gridStyle,
    textStyle
  };
}

test("Creates a top-level styles object with only used styles when styles option is set to true", async () => {
  const { paintStyle, effectStyle, textStyle, gridStyle } = createStyles();

  const container = figma.createFrame();
  const text = figma.createText();
  const rectangle = figma.createRectangle();
  container.appendChild(text);
  container.appendChild(rectangle);

  container.gridStyleId = gridStyle.id;
  text.textStyleId = textStyle.id;
  rectangle.fillStyleId = paintStyle.id;
  rectangle.effectStyleId = effectStyle.id;

  const d = await dump([container]);

  const styleMap: F.StyleMap = {
    [paintStyle.id]: {
      key: paintStyle.key,
      name: paintStyle.name,
      styleType: paintStyle.type,
      remote: paintStyle.remote,
      description: paintStyle.description
    },
    [effectStyle.id]: {
      key: effectStyle.key,
      name: effectStyle.name,
      styleType: effectStyle.type,
      remote: effectStyle.remote,
      description: effectStyle.description
    },
    [textStyle.id]: {
      key: textStyle.key,
      name: textStyle.name,
      styleType: textStyle.type,
      remote: textStyle.remote,
      description: textStyle.description
    },
    [gridStyle.id]: {
      key: gridStyle.key,
      name: gridStyle.name,
      styleType: gridStyle.type,
      remote: gridStyle.remote,
      description: gridStyle.description
    }
  };

  expect(d.styles).toEqual(styleMap);
});

test("Doesn't include unused styles", async () => {
  const { paintStyle } = createStyles();

  const container = figma.createFrame();
  container.fillStyleId = paintStyle.id;

  const d = await dump([container]);

  const styleMap: F.StyleMap = {
    [paintStyle.id]: {
      key: paintStyle.key,
      name: paintStyle.name,
      styleType: paintStyle.type,
      remote: paintStyle.remote,
      description: paintStyle.description
    }
  };

  expect(d.styles).toEqual(styleMap);
});

test("Doesn't include same style multiple times", async () => {
  const { paintStyle } = createStyles();

  const container = figma.createFrame();
  const rectangle = figma.createRectangle();
  container.appendChild(rectangle);

  container.fillStyleId = paintStyle.id;
  rectangle.fillStyleId = paintStyle.id;
  rectangle.strokeStyleId = paintStyle.id;

  const d = await dump([container]);

  const styleMap: F.StyleMap = {
    [paintStyle.id]: {
      key: paintStyle.key,
      name: paintStyle.name,
      styleType: paintStyle.type,
      remote: paintStyle.remote,
      description: paintStyle.description
    }
  };

  expect(d.styles).toEqual(styleMap);
});

test("Doesn't include mixed styles", async () => {
  const container = figma.createFrame();
  container.fillStyleId = Symbol("fakeMixedValue") as typeof figma.mixed;

  const d = await dump([container]);

  expect(d.styles).toEqual({});
});

test("Doesn't create styles when option is set to false", async () => {
  const { paintStyle, textStyle } = createStyles();

  const container = figma.createFrame();
  const text = figma.createText();
  container.appendChild(text);

  container.fillStyleId = paintStyle.id;
  text.textStyleId = textStyle.id;

  const d = await dump([container], { styles: false });

  expect(d.styles).toEqual({});
});
