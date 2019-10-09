import dump from "../src/index";

// Dump document selection to JSON

const o = dump(figma.currentPage.selection[0]);
console.log("current selection data: ", JSON.stringify(o));

figma.closePlugin();
