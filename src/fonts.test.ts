import { createFigma } from "figma-api-stub";
import { Inter } from "figma-api-stub/dist/fonts";

import * as F from "./figma-json";
import {
  dump,
  fontsToLoad,
  loadFonts,
  fallbackFonts,
  applyFontName,
  encodeFont
} from ".";

const notInstalledFontFamily = "My Custom Font";

beforeEach(() => {
  (globalThis as any).figma = createFigma({});

  // Replace figma-api-stub's mock with one that fails to load the not installed font family.
  const loadFontAsyncMock = jest.fn(async (font: FontName) => {
    return new Promise<void>((resolve, reject) => {
      if (font.family === notInstalledFontFamily) {
        reject("Font not found");
      } else {
        resolve();
      }
    });
  });

  figma.loadFontAsync = loadFontAsyncMock;
});

// TODO: Add a test to check if it ignores figma.mixed
test("Finds fonts to load", async () => {
  const installedFont = {
    family: "DIN Alternate",
    style: "Regular"
  };
  const notInstalledFont = {
    family: notInstalledFontFamily,
    style: "Regular"
  };

  const text1 = figma.createText();
  text1.fontName = Inter[0].fontName;
  text1.characters = "Text 1";

  const text2 = figma.createText();
  text2.fontName = installedFont;
  text2.characters = "Text 2";

  const container = figma.createFrame();
  container.appendChild(text1);
  container.appendChild(text2);

  const text3 = figma.createText();
  text3.fontName = notInstalledFont;
  text3.characters = "Text 3";

  // Intentionally include a nested font
  const nestedContainer = figma.createFrame();
  nestedContainer.appendChild(text3);
  container.appendChild(nestedContainer);

  const d = await dump([container]);

  const fonts = fontsToLoad(d);
  const expected: F.FontName[] = [
    Inter[0].fontName,
    installedFont,
    notInstalledFont
  ];
  expect(fonts).toEqual(expected);
});

test("Loads fonts that user has installed", async () => {
  const requestedFonts: F.FontName[] = [
    Inter[3].fontName,
    {
      family: "Avenir",
      style: "Bold"
    }
  ];
  const { availableFonts, missingFonts } = await loadFonts(
    requestedFonts,
    fallbackFonts
  );

  expect(availableFonts).toEqual(requestedFonts);
  expect(missingFonts).toEqual([]);
});

test("Detects missing fonts without choking", async () => {
  const requestedFonts: F.FontName[] = [
    {
      family: notInstalledFontFamily,
      style: "Regular"
    }
  ];
  const { availableFonts, missingFonts } = await loadFonts(
    requestedFonts,
    fallbackFonts
  );

  expect(availableFonts).toEqual([]);
  expect(missingFonts).toEqual(requestedFonts);
});

test("Finds font replacements", async () => {
  const notInstalledFontBold = {
    family: notInstalledFontFamily,
    style: "Bold"
  };
  const notInstalledFontSemiBold = {
    family: notInstalledFontFamily,
    style: "Semi Bold"
  };
  const notInstalledFontCustomStyle = {
    family: notInstalledFontFamily,
    style: "Custom Style"
  };

  const requestedFonts: F.FontName[] = [
    notInstalledFontBold,
    notInstalledFontSemiBold,
    notInstalledFontCustomStyle
  ];
  const { fontReplacements } = await loadFonts(requestedFonts, fallbackFonts);

  expect(fontReplacements).toEqual({
    [encodeFont(notInstalledFontBold)]: encodeFont({
      family: "Inter",
      style: "Bold"
    }),
    [encodeFont(notInstalledFontSemiBold)]: encodeFont({
      family: "Inter",
      style: "Semi Bold"
    }),
    // Default to Inter Regular
    [encodeFont(notInstalledFontCustomStyle)]: encodeFont({
      family: "Inter",
      style: "Regular"
    })
  });
});

test("Applies font", async () => {
  const text1 = figma.createText();
  text1.characters = "Text 1";

  const text2 = figma.createText();
  text2.characters = "Text 2";

  const text3 = figma.createText();
  text3.characters = "Text 3";
  const originalFontText3 = text3.fontName;

  // Fonts to apply
  const installedFont = {
    family: "Georgia",
    style: "Bold"
  };
  const notInstalledFont = {
    family: notInstalledFontFamily,
    style: "Light"
  };
  const mixedFont: F.Mixed = "__Symbol(figma.mixed)__";

  const { fontReplacements } = await loadFonts(
    [installedFont, notInstalledFont],
    fallbackFonts
  );

  applyFontName(text1, installedFont, fontReplacements);
  applyFontName(text2, notInstalledFont, fontReplacements);
  applyFontName(text3, mixedFont, fontReplacements);

  expect(text1.fontName).toEqual(installedFont);
  // Not installed font should be replaced with fallback
  expect(text2.fontName).toEqual({
    family: "Inter",
    style: "Light"
  });
  // Skips mixed fonts
  expect(text3.fontName).toEqual(originalFontText3);
});
