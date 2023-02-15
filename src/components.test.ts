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
    name: "My Nice Component",
    key: "baby",
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
    mainComponent: sourceComponent,
    children: []
  };

  const d = await dump([sourceInstance as any as InstanceNode]);

  const expected: F.ComponentMap = {
    "123:456": {
      key: "baby",
      name: "My Nice Component",
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
    description: "",
    remote: false
  };
  const sourceComponent = {
    ...defaultLayers.FRAME,
    type: "COMPONENT",
    name: "My Nice Component",
    key: "baby",
    id: "123:456",
    backgrounds: [{ type: "IMAGE", imageHash: "A", scaleMode: "FILL" }],
    ...componentDefaults
  };

  const sourceInstance = {
    ...defaultLayers.FRAME,
    type: "INSTANCE",
    mainComponent: sourceComponent,
    children: []
  };

  const sourceComponentSet = {
    ...defaultLayers.FRAME,
    type: "COMPONENT_SET",
    name: "My Nice Component Set",
    key: "baby-set",
    id: "123:789",
    children: [sourceInstance as any as InstanceNode],
    ...componentDefaults
  };

  // @ts-ignore
  sourceComponent["parent"] = sourceComponentSet as any as ComponentSetNode;

  const d = await dump([sourceInstance as any as ComponentSetNode]);

  const components: F.ComponentMap = {
    "123:456": {
      key: "baby",
      name: "My Nice Component",
      description: "",
      remote: false,
      documentationLinks: [],
      componentSetId: "123:789"
    }
  };
  const componentSets: F.ComponentSetMap = {
    "123:789": {
      key: "baby-set",
      name: "My Nice Component Set",
      description: "",
      remote: false
    }
  };
  expect(d.components).toEqual(components);
  expect(d.componentSets).toEqual(componentSets);
});
