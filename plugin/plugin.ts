import { dump, insert } from "../src";
import * as F from "../src/figma-json";
import genDefaults from "../src/genDefaults";
import { UIToPluginMessage, PluginToUIMessage } from "./pluginMessage";

const html = `<style>
body {
  background: white;
  margin: 0;
  padding: 0;
  font: "Roboto mono";
}
</style>
<div id="react-page"></div>
<script>${__html__}</script>
`;

// Cause our plugin to show
figma.showUI(html, { width: 400, height: 400 });

console.log("This in plugin:", globalThis);

// Logs defaults to console, can copy to clipboard in Figma devtools
// showDefaults();

let updateEventsPaused = false;

figma.ui.onmessage = (pluginMessage: any, props: OnMessageProperties) => {
  const message = pluginMessage as UIToPluginMessage;
  switch (message.type) {
    case "insert":
      const { data } = message;
      updateEventsPaused = true;
      doInsert(data);
      updateEventsPaused = false;
      break;
    case "ready":
      tellUIAboutStoredText();
      updateUIWithSelection();
      break;
  }
};

figma.on("selectionchange", () => {
  console.log("updating after selection change!");
  if (!updateEventsPaused) {
    updateUIWithSelection();
  }
});

figma.on("close", () => {
  console.log("Plugin closing.");
});

const defaultContstraints: F.Constraints = {
  horizontal: "MIN",
  vertical: "MIN"
};
const defaultTransform: F.Transform = [
  [1, 0, 0],
  [0, 1, 0]
];

async function tellUIAboutStoredText() {
  // const text = await figma.clientStorage.getAsync("recentInsertText");
  // if (typeof text === "string") {
  //   postMessage({ type: "updateInsertText", recentInsertText: text });
  //   return;
  // }
  const l: F.FrameNode = {
    pluginData: {
      "com.layershot.meta":
        '{"layerClass":"UIWindowLayer","viewClass":"UIWindow"}'
    },
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
      [1, 0, 1706],
      [0, 1, 170]
    ],
    x: 1706,
    y: 170,
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
  const basic: F.DumpedFigma = {
    objects: [l],
    images: {}
  };
  postMessage({
    type: "updateInsertText",
    recentInsertText: JSON.stringify(basic, null, 2)
  });
}

// Helper to make sure we're only sending valid events to the plugin UI
function postMessage(message: PluginToUIMessage) {
  figma.ui.postMessage(message);
}

function tick(n: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, n);
  });
}

async function doInsert(data: F.DumpedFigma) {
  // figma.clientStorage.setAsync("recentInsertText", JSON.stringify(data));
  await tick(200);
  console.log("plugin inserting: ", data);
  // TODO: this is broken, not clear why...
  const prom = insert(data);
  await tick(200);
  console.log("promise to insert is ", prom);
  await prom;
  // insert(data);
  console.log("plugin done inserting.");
  postMessage({ type: "didInsert" });
}

// TODO: expose this in plugin
async function showDefaults() {
  const defaults = await genDefaults();
  console.log("defaults: ", defaults);
}

async function updateUIWithSelection() {
  try {
    // Dump document selection to JSON
    const data = await dump(figma.currentPage.selection);
    postMessage({ type: "update", data });
  } catch (e) {
    console.error("error during plugin: ", e);
  } finally {
  }
}
