/**
 * @jest-environment ./src/testUtil/figmaEnvironment.ts
 */
import { dump } from ".";
import puppeteer from "puppeteer-core";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import os from "os";

const DIR = path.join(os.tmpdir(), "jest_puppeteer_global_setup");

// setup code
beforeAll(async () => {
  console.log("Running beforeAll...", DIR);

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/Applications/Figma.app/Contents/MacOS/Figma"
  });
  // store the browser instance so we can teardown it later
  // this global is only available in the teardown but not in TestEnvironments
  globalThis.__BROWSER_GLOBAL__ = browser;

  // use the file system to expose the wsEndpoint for TestEnvironments
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, "wsEndpoint"), browser.wsEndpoint());
});

// afterAll(async () => {
//   console.log("Running afterAll...");
//   if (globalThis.__BROWSER_GLOBAL__) {
//     await globalThis.__BROWSER_GLOBAL__.close();
//   }
// });

test("runs test within figma", () => {
  console.log("Running test");
  expect(figma).toBeDefined();
});
