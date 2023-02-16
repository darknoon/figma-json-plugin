import { dump, insert } from "../src";
import * as F from "../src/figma-json";
import genDefaults from "../src/genDefaults";
import defaultLayers from "../src/figma-default-layers";
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
    case "logDefaults":
      logDefaults();
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

async function tellUIAboutStoredText() {
  const l: F.FrameNode = {
    ...defaultLayers.FRAME
  };

  const basic: F.DumpedFigma = {
    objects: [l],
    components: {},
    componentSets: {},
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

async function logDefaults() {
  const defaults = await genDefaults();
  console.log("defaults: ", defaults);
}

async function updateUIWithSelection() {
  try {
    // Dump document selection to JSON
    const opt = { images: true };
    console.log("dumping...", opt);
    const data = await dump(figma.currentPage.selection, opt);
    postMessage({ type: "update", data });
  } catch (e) {
    console.error("error during plugin: ", e);
  } finally {
  }
}
