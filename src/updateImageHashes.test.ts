import * as F from "./figma-json";
import updateImageHashes from "./updateImageHashes";
import defaultLayers from "./figma-default-layers";

test("Updates fills", () => {
  const updates = new Map([["A", "B"]]);
  const bgFrame: F.FrameNode = {
    ...defaultLayers.FRAME,
    fills: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }]
  };
  expect(updateImageHashes(bgFrame, updates)).toEqual({
    ...defaultLayers.FRAME,
    fills: [{ type: "IMAGE", imageHash: "B", scaleMode: "FILL" }]
  });
});

test("Nulls missing fills", () => {
  const emptyUpdates = new Map();
  const bgFrame: F.FrameNode = {
    ...defaultLayers.FRAME,
    fills: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }]
  };
  expect(updateImageHashes(bgFrame, emptyUpdates)).toEqual({
    ...defaultLayers.FRAME,
    fills: [{ type: "IMAGE", imageHash: null, scaleMode: "FILL" }]
  });
});
