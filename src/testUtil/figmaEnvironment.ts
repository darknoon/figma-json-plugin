import os from "os";
import path from "path";
import puppeteer, { Browser, Page as PuppeteerPage } from "puppeteer";
import NodeEnvironment from "jest-environment-node";
import { EnvironmentContext, JestEnvironmentConfig } from "@jest/environment";
import { readFile } from "fs/promises";

const DIR = path.join(os.tmpdir(), "jest_puppeteer_global_setup");

// Declare the global __FIGMA__ variable
declare global {
  var __FIGMA__: FigmaProxy;
  var __BROWSER_GLOBAL__: Browser;
}

// Takes an object whose properties are sync or async functions and creates a type where they are all async
type Asyncify<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
    : T[K] extends any
    ? () => Promise<T[K]>
    : never;
};

class FigmaProxy implements Partial<Asyncify<PluginAPI>> {
  page: PuppeteerPage;
  constructor(page: PuppeteerPage) {
    this.page = page;
  }
  editorType(): Promise<"figma" | "figjam"> {
    return this.page.evaluate(() => figma.editorType);
  }
}

export default class FigmaEnvironment extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, _context: EnvironmentContext) {
    super(config, _context);
  }

  async setup() {
    console.log("Setting up FigmaEnvironment...");
    await super.setup();
    // get the wsEndpoint
    const wsEndpoint = await readFile(path.join(DIR, "wsEndpoint"), "utf8");
    if (!wsEndpoint) {
      throw new Error("wsEndpoint not found");
    }

    // connect to puppeteer
    console.log("Connecting to puppeteer at...", wsEndpoint);
    this.global.__BROWSER_GLOBAL__ = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint
    });
  }

  async teardown() {
    console.log("Tearing down FigmaEnvironment...");
    if (this.global.__BROWSER_GLOBAL__) {
      this.global.__BROWSER_GLOBAL__.disconnect();
    }
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}
