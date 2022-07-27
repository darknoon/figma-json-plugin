import * as F from "./figma-json";
import updateImageHashes from "./updateImageHashes";

// 2x3 identitiy matrix
const transformDefault: F.Transform = [
  [1, 0, 0],
  [0, 1, 0]
];

const frameDefaults: F.FrameNode = {
  type: "FRAME",
  name: "_",
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  // New props so annoying
  backgrounds: [],
  blendMode: "PASS_THROUGH",
  locked: false,
  visible: true,
  layoutMode: "NONE",
  primaryAxisSizingMode: "FIXED",
  counterAxisSizingMode: "FIXED",
  primaryAxisAlignItems: "MIN",
  counterAxisAlignItems: "MIN",
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  itemSpacing: 0,
  horizontalPadding: 0,
  verticalPadding: 0,
  layoutGrids: [],
  gridStyleId: "",
  clipsContent: false,
  guides: [],
  id: "",
  removed: false,
  children: [],
  expanded: false,
  backgroundStyleId: "",
  strokeCap: "NONE",
  strokeMiterLimit: 0,
  strokes: [],
  strokeStyleId: "",
  strokeWeight: 0,
  strokeJoin: "ROUND",
  strokeAlign: "CENTER",
  dashPattern: [],
  strokeGeometry: [],
  fills: [],
  fillStyleId: "",
  fillGeometry: [],
  cornerRadius: 0,
  cornerSmoothing: 0,
  topLeftRadius: 0,
  topRightRadius: 0,
  bottomLeftRadius: 0,
  bottomRightRadius: 0,
  opacity: 0,
  isMask: false,
  effects: [],
  effectStyleId: "",
  constraints: { horizontal: "MIN", vertical: "MIN" },
  relativeTransform: transformDefault,
  rotation: 0,
  constrainProportions: false,
  layoutAlign: "MIN",
  layoutGrow: 0,
  exportSettings: [],
  overflowDirection: "NONE",
  numberOfFixedChildren: 0,
  overlayPositionType: "CENTER",
  overlayBackground: {
    type: "NONE"
  },
  overlayBackgroundInteraction: "NONE",
  reactions: []
};
test("Updates background", () => {
  const updates = new Map([["A", "B"]]);
  const bgFrame: F.FrameNode = {
    ...frameDefaults,
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }]
  };
  expect(updateImageHashes(bgFrame, updates)).toEqual({
    ...frameDefaults,
    backgrounds: [{ type: "IMAGE", imageHash: "B", scaleMode: "FILL" }]
  });
});

test("Nulls missing background", () => {
  const emptyUpdates = new Map();
  const bgFrame: F.FrameNode = {
    ...frameDefaults,
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }]
  };
  expect(updateImageHashes(bgFrame, emptyUpdates)).toEqual({
    ...frameDefaults,
    backgrounds: [{ type: "IMAGE", imageHash: null, scaleMode: "FILL" }]
  });
});
