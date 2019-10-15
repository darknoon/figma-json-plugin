import { dump, insert } from "../src";

// Waiting for top-level await in Chrome…
(async () => {
  try {
    // Dump document selection to JSON
    const dumped = await dump(figma.currentPage.selection);
    console.log(
      "current selection data: ",
      JSON.stringify(dumped.objects),
      dumped.images
    );

    // Insert it back into the current document, ie make a copy.
    // This is just for testing
    console.log("inserting again...");
    const inserted = await insert(dumped);
    console.log("inserted object: ", inserted);
  } catch (e) {
    console.error("error during plugin: ", e);
  } finally {
    figma.closePlugin();
  }
})();
