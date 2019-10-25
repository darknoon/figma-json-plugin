import { dump, insert } from "../src";
// import genDefaults from "../src/genDefaults";

figma.showUI(__html__);
updateUIWhenReady();

// We need to wait for the plugin to be done starting
const pluginUIReady = new Promise(resolve => {
  figma.ui.onmessage = message => {
    console.log("Plugin UI is ready");
    resolve(message);
    figma.ui.onmessage = undefined;
  };
});

figma.on("selectionchange", () => {
  console.log("updating after selection change!");
  updateUIWhenReady();
});

async function updateUIWhenReady() {
  try {
    // const defaults = await genDefaults();
    // console.log("defaults", defaults);

    // Dump document selection to JSON
    const dumped = await dump(figma.currentPage.selection);
    await pluginUIReady;
    // console.log(
    //   "current selection data: ",
    //   JSON.stringify(dumped.objects),
    //   dumped.images
    // );

    const message = { status: "dumped", dump: dumped };
    console.log("Posting message to UI...", message);
    figma.ui.postMessage(message);

    // // Insert it back into the current document, ie make a copy.
    // // This is just for testing
    // console.log("inserting again...");
    // const inserted = await insert(dumped);
    // console.log("inserted object: ", inserted);
  } catch (e) {
    console.error("error during plugin: ", e);
  } finally {
    // figma.closePlugin();
  }
}
