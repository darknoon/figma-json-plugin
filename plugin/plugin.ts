import { dump, insert, DumpedFigma } from "../src";
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

// Helper to make sure we're only sending valid events to the plugin UI
function postMessage(message: PluginToUIMessage) {
  figma.ui.postMessage(message);
}

async function doInsert(data: DumpedFigma) {
  console.log("plugin inserting: ", data);
  // TODO: this is broken, not clear why...
  // await insert(data);
  insert(data);
  console.log("plugin done inserting.");
  postMessage({ type: "didInsert" });
}

// TODO: expose this in plugin
async function showDefaults() {
  const defaults = await genDefaults();
  figma.ui.postMessage;
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
