import { dump, insert } from "../src";
import { FigmaJSON as F } from "ca-to-layershot";
import genDefaults from "../src/genDefaults";
import { UIToPluginMessage, PluginToUIMessage } from "./pluginMessage";

// Cause our plugin to show
figma.showUI(__html__);

figma.ui.onmessage = (pluginMessage: any, props: OnMessageProperties) => {
  const message = pluginMessage as UIToPluginMessage;
  switch (message.type) {
    case "insert":
      const { data } = message;
      doInsert(data);
      break;
    case "ready":
      tellUIAboutStoredText();
      updateUIWithSelection();
      break;
  }
};

figma.on("selectionchange", () => {
  console.log("updating after selection change!");
  updateUIWithSelection();
});

figma.on("close", () => {
  console.log("Plugin closing.");
});

async function tellUIAboutStoredText() {
  // const text = await figma.clientStorage.getAsync("recentInsertText");
  // if (typeof text === "string") {
  //   postMessage({ type: "updateInsertText", recentInsertText: text });
  // }
  const basic = {
    objects: [
      {
        // locked: false,
        // visible: true,
        pluginData: {
          "com.layershot.meta":
            '{"layerClass":"UIWindowLayer","viewClass":"UIWindow"}'
        },
        // constraints: {
        //   horizontal: "MIN",
        //   vertical: "MIN"
        // },
        // opacity: 1,
        // blendMode: "NORMAL",
        // isMask: false,
        // effects: [],
        // effectStyleId: "",
        x: 207,
        y: 448,
        width: 414,
        height: 896,
        rotation: 0,
        children: [],
        // relativeTransform: [[0, 0, 0], [0, 0, 0]],
        // exportSettings: [],
        // backgrounds: [],
        // backgroundStyleId: "",
        clipsContent: false,
        // layoutGrids: [],
        // guides: [],
        // gridStyleId: "",
        name: "Frame",
        type: "FRAME"
      }
    ],
    images: {}
  };
  postMessage({
    type: "updateInsertText",
    recentInsertText: JSON.stringify(basic)
  });
}

// Helper to make sure we're only sending valid events to the plugin UI
function postMessage(message: PluginToUIMessage) {
  figma.ui.postMessage(message);
}

function tick(n: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, n);
  });
}

async function doInsert(data: F.DumpedFigma) {
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

  figma.clientStorage.setAsync("recentInsertText", JSON.stringify(data));
}

// TODO: expose this in plugin
async function showDefaults() {
  const defaults = await genDefaults();
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
