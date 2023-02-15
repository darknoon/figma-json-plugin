import * as F from "./figma-json";
// import components from "./components";
import defaultLayers from "./figma-default-layers";
import { dump } from ".";

beforeAll(() => {
  (globalThis as any).figma = {};
});

test("Takes components in the document and produces component ids like the REST api in the result", async () => {
  const sourceComponent = {
    ...defaultLayers.FRAME,
    type: "COMPONENT",
    key: "baby",
    id: "123:456",
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }]
  };

  const sourceInstance = {
    ...defaultLayers.FRAME,
    type: "INSTANCE",
    mainComponent: sourceComponent,
    children: []
  };

  const d = await dump([sourceInstance as any as InstanceNode]);

  const expected: F.ComponentMap = {
    "123:456": {
      key: "baby",
      name: "Frame",
      description: "",
      remote: false,
      documentationLinks: []
    }
  };
  expect(d.components).toEqual(expected);

  expect(d.components).toMatchSnapshot();
  expect(d.componentSets).toEqual({});
});
