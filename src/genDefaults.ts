import { dump } from "./index";
import { fromEntries } from "./polyfill";
import { FigmaJSON as F } from "ca-to-layershot";

export default async function genDefaults() {
  const defaults = {
    RECTANGLE: figma.createRectangle(),
    LINE: figma.createLine(),
    ELLIPSE: figma.createEllipse(),
    POLYGON: figma.createPolygon(),
    STAR: figma.createStar(),
    VECTOR: figma.createVector(),
    TEXT: figma.createText(),
    FRAME: figma.createFrame(),
    // Is this a component instance or original component???
    COMPONENT: figma.createComponent()

    // Not sceneNodes…
    // PAGE: figma.createPage(),
    // SLICE: figma.createSlice()
  };
  const k = Object.keys(defaults);
  const v = Object.values(defaults);
  const { objects } = await dump(v);
  // give ts a little kick that it's a tuple
  const dups = objects.map((v, i: number): [string, F.SceneNode] => [k[i], v]);
  return fromEntries(dups);
}
