/// <reference types="@figma/plugin-typings" />

import { dump } from "./read";
import * as F from "./figma-json";

export default async function genDefaults() {
  const defaults = {
    RECTANGLE: figma.createRectangle(),
    LINE: figma.createLine(),
    ELLIPSE: figma.createEllipse(),
    POLYGON: figma.createPolygon(),
    STAR: figma.createStar(),
    VECTOR: figma.createVector(),
    TEXT: figma.createText(),
    FRAME: figma.createFrame()

    // Not sceneNodes…
    // PAGE: figma.createPage(),
    // SLICE: figma.createSlice()
    //COMPONENT: figma.createComponent()
  };

  const k = Object.keys(defaults);
  const v = Object.values(defaults);
  const { objects } = await dump(v);
  // give ts a little kick that it's a tuple
  const dups = objects.map((v, i: number): [string, F.SceneNode] => [k[i], v]);
  return Object.fromEntries(dups);
}
