import * as F from "./figma-json";
import updateImageHashes from "./updateImageHashes";

// 2x3 identity matrix
const transformDefault: F.Transform = [
  [1, 0, 0],
  [0, 1, 0]
];

const frameDefaults: F.FrameNode = {
  id: "",
  name: "Test Frame",
  removed: false,
  visible: true,
  locked: false,
  componentPropertyReferences: null,
  opacity: 1,
  blendMode: "PASS_THROUGH",
  isMask: false,
  effects: [],
  effectStyleId: "",
  relativeTransform: [
    [1, 0, 1134],
    [0, 1, -488]
  ],
  x: 1134,
  y: -488,
  width: 375,
  height: 812,
  rotation: 0,
  layoutAlign: "INHERIT",
  constrainProportions: false,
  layoutGrow: 0,
  layoutPositioning: "AUTO",
  children: [],
  exportSettings: [],
  fills: [
    {
      type: "SOLID",
      visible: true,
      opacity: 1,
      blendMode: "NORMAL",
      color: {
        r: 1,
        g: 1,
        b: 1
      }
    }
  ],
  fillStyleId: "",
  strokes: [],
  strokeStyleId: "",
  strokeWeight: 1,
  strokeAlign: "INSIDE",
  strokeJoin: "MITER",
  dashPattern: [],
  strokeCap: "NONE",
  strokeMiterLimit: 4,
  fillGeometry: [
    {
      windingRule: "NONZERO",
      data: "M0 0L375 0L375 812L0 812L0 0Z"
    }
  ],
  strokeGeometry: [],
  cornerRadius: 0,
  cornerSmoothing: 0,
  topLeftRadius: 0,
  topRightRadius: 0,
  bottomLeftRadius: 0,
  bottomRightRadius: 0,
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,
  primaryAxisAlignItems: "MIN",
  counterAxisAlignItems: "MIN",
  primaryAxisSizingMode: "AUTO",
  strokeTopWeight: 1,
  strokeBottomWeight: 1,
  strokeLeftWeight: 1,
  strokeRightWeight: 1,
  layoutGrids: [],
  gridStyleId: "",
  backgrounds: [
    {
      type: "SOLID",
      visible: true,
      opacity: 1,
      blendMode: "NORMAL",
      color: {
        r: 1,
        g: 1,
        b: 1
      }
    }
  ],
  backgroundStyleId: "",
  clipsContent: true,
  guides: [],
  expanded: true,
  constraints: {
    horizontal: "MIN",
    vertical: "MIN"
  },
  layoutMode: "NONE",
  counterAxisSizingMode: "FIXED",
  horizontalPadding: 0,
  verticalPadding: 0,
  itemSpacing: 0,
  overflowDirection: "NONE",
  numberOfFixedChildren: 0,
  overlayPositionType: "CENTER",
  overlayBackground: {
    type: "NONE"
  },
  overlayBackgroundInteraction: "NONE",
  itemReverseZIndex: false,
  strokesIncludedInLayout: false,
  reactions: [],
  type: "FRAME"
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
