import * as F from "./figma-json";
import updateImageHashes from "./updateImageHashes";
import defaultLayers from "./figma-default-layers";

test("Updates background", () => {
  const updates = new Map([["A", "B"]]);
  const bgFrame: F.FrameNode = {
    ...defaultLayers.FRAME,
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }]
  };
  expect(updateImageHashes(bgFrame, updates)).toEqual({
    ...defaultLayers.FRAME,
    backgrounds: [{ type: "IMAGE", imageHash: "B", scaleMode: "FILL" }]
  });
});

test("Nulls missing background", () => {
  const emptyUpdates = new Map();
  const bgFrame: F.FrameNode = {
    ...defaultLayers.FRAME,
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }]
  };
  expect(updateImageHashes(bgFrame, emptyUpdates)).toEqual({
    ...defaultLayers.FRAME,
    backgrounds: [{ type: "IMAGE", imageHash: null, scaleMode: "FILL" }]
  });
});
