import { createFigma } from "figma-api-stub";
import { Inter, Roboto } from "figma-api-stub/dist/fonts";

import * as F from "./figma-json";
import { dump, fontsToLoad, loadFonts, getReplacementFont } from ".";

// TODO: When to use FontName vs F.FontName?
// TODO: Use describe?
// TODO: Move tests to folder?
// TODO: TEST WE'RE NOT ALWAYS USING INTER

const customFontName = {
  family: "My Custom Font",
  style: "Regular"
};

beforeEach(() => {
  (globalThis as any).figma = createFigma({});
});

test("Finds fonts to load", async () => {
  const container = createTextComp(figma);
  const d = await dump([container]);

  const fonts = fontsToLoad(d);
  const expected: F.FontName[] = [
    Inter[0].fontName,
    Inter[1].fontName,
    customFontName
  ];
  expect(fonts).toEqual(expected);
});

// TODO: Maybe split up into multiple tests
// with one for missing fonts
test("Loads fonts", async () => {
  const container = createTextComp(figma);
  const d = await dump([container]);

  const loadFontAsyncMock = jest.fn(async (font: FontName) => {
    return new Promise<void>((resolve, reject) => {
      if (
        font.family === customFontName.family &&
        font.style === customFontName.style
      ) {
        reject("Font not found");
      }

      resolve();
    });
  });

  // Replace figma-api-stub's mock with one that fails to load custom fonts.
  // We don't have to undo this because we create a new figma instance for each test.
  figma.loadFontAsync = loadFontAsyncMock;

  const { usedFonts, loadedFonts, missingFonts } = await loadFonts(d);

  const expectedUsed: F.FontName[] = [
    Inter[0].fontName,
    Inter[1].fontName,
    customFontName
  ];
  const expectedLoaded: F.FontName[] = [Inter[0].fontName, Inter[1].fontName];
  const expectedMissing: F.FontName[] = [customFontName];

  expect(usedFonts).toEqual(expectedUsed);
  expect(loadedFonts).toEqual(expectedLoaded);
  expect(missingFonts).toEqual(expectedMissing);
});

// TODO: No longer has access to Figma object
describe("Finds appropriate replacement for missing font", () => {
  test("Replaces with Inter", async () => {
    expect(
      getReplacementFont({
        family: "Avenir",
        style: "Regular"
      }).family
    ).toBe("Inter");
  });

  test("Matches original font style", async () => {
    expect(
      getReplacementFont({
        family: "Avenir",
        style: "Black"
      }).style
    ).toBe("Black");
  });

  test("Handles obscure font style", async () => {
    expect(
      getReplacementFont({
        family: "Avenir",
        style: "Extravagant"
      }).style
    ).toBe("Regular");
  });
});

function createTextComp(figma: PluginAPI) {
  const text1 = figma.createText();
  text1.fontName = Inter[0].fontName;
  text1.characters = "Text 1";

  const text2 = figma.createText();
  text2.fontName = Inter[1].fontName;
  text2.characters = "Text 2";

  const text3 = figma.createText();
  text3.fontName = customFontName;
  text3.characters = "Text 3";

  const container = figma.createFrame();
  container.appendChild(text1);
  container.appendChild(text2);

  // Intentionally include a nested font
  const nestedContainer = figma.createFrame();
  nestedContainer.appendChild(text3);
  container.appendChild(nestedContainer);

  return container;
}
