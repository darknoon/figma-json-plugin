import * as F from "./figma-json";
// import components from "./components";
import defaultLayers from "./figma-default-layers";
import { dump } from ".";

// Inject a fake figma object into the global scope as a hack
beforeAll(() => {
  (globalThis as any).figma = {};
});

test("Takes components in the document and produces component ids like the REST api in the result", async () => {
  const sourceComponent = {
    ...defaultLayers.FRAME,
    type: "COMPONENT",
    name: "Info Button",
    key: "6848d756da66e55b42f79c0728e351ad",
    id: "123:456",
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }],
    documentationLinks: [],
    description: "",
    remote: false,
    parent: null
  };

  const sourceInstance = {
    ...defaultLayers.FRAME,
    type: "INSTANCE",
    name: "Info Button",
    mainComponent: sourceComponent,
    children: []
  };

  const d = await dump([sourceInstance as any as InstanceNode]);

  const expected: F.ComponentMap = {
    "123:456": {
      key: "6848d756da66e55b42f79c0728e351ad",
      name: "Info Button",
      description: "",
      remote: false,
      documentationLinks: []
    }
  };
  expect(d.components).toEqual(expected);
  expect(d.componentSets).toEqual({});
});

// Component Sets

test("Takes component sets in the document and produces component set ids like the REST api in the result", async () => {
  const componentDefaults = {
    documentationLinks: [],
    description: "A rounded button with a few variants",
    remote: false
  };
  const sourceComponent = {
    ...defaultLayers.FRAME,
    type: "COMPONENT",
    name: "type=primary, size=large",
    key: "6848d756da66e55b42f79c0728e351ad",
    id: "123:456",
    parent: null as SceneNode | null,
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }],
    ...componentDefaults,
    description: "The primary large button"
  };

  const sourceInstance = {
    ...defaultLayers.FRAME,
    type: "INSTANCE",
    name: "Checkout Button",
    mainComponent: sourceComponent,
    children: []
  };

  const sourceComponentSet = {
    ...defaultLayers.FRAME,
    type: "COMPONENT_SET",
    name: "Rounded Button",
    key: "83218ac34c1834c26781fe4bde918ee4",
    id: "123:789",
    // This isn't used currently, but just making sure we simulate the real thing
    children: [sourceComponent as any as ComponentNode],
    ...componentDefaults
  };

  sourceComponent["parent"] = sourceComponentSet as any as ComponentSetNode;

  const d = await dump([sourceInstance as any as InstanceNode]);

  const components: F.ComponentMap = {
    "123:456": {
      key: "6848d756da66e55b42f79c0728e351ad",
      name: "type=primary, size=large",
      description: "The primary large button",
      remote: false,
      documentationLinks: [],
      componentSetId: "123:789"
    }
  };
  const componentSets: F.ComponentSetMap = {
    "123:789": {
      key: "83218ac34c1834c26781fe4bde918ee4",
      name: "Rounded Button",
      description: "A rounded button with a few variants",
      documentationLinks: [],
      remote: false
    }
  };
  expect(d.components).toEqual(components);
  expect(d.componentSets).toEqual(componentSets);
});
