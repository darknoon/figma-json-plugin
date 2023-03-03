import { Options } from ".";
import {
  conditionalReadBlacklist as fast,
  conditionalReadBlacklistSimple as simple
} from "./readBlacklist";

const TestMatrix: {
  name: string;
  fn: typeof simple | typeof fast;
  opts: Pick<Options, "geometry">;
}[] = [
  { name: "simple", fn: simple, opts: { geometry: "none" } },
  { name: "fast", fn: fast, opts: { geometry: "none" } },
  { name: "simple", fn: simple, opts: { geometry: "paths" } },
  { name: "fast", fn: fast, opts: { geometry: "paths" } }
];

test.each(TestMatrix)(
  "text layer never has fillGeometry because too many points ($name) geom = $opts.geometry",
  ({ fn, opts }) => {
    const l = { type: "TEXT" };
    expect(fn(l, opts)).toContain("fillGeometry");
  }
);

test.each(TestMatrix)(
  "star layer has fillGeometry when appropriate",
  ({ fn, opts }) => {
    const l = { type: "STAR" };
    if (opts.geometry === "none") {
      expect(fn(l, opts)).toContain("fillGeometry");
    } else {
      expect(fn(l, opts)).not.toContain("fillGeometry");
    }
  }
);

test("component that has component set parent doesn't allow componentPropertyDefinitions", () => {
  const l = { type: "COMPONENT", parent: { type: "COMPONENT_SET" } };
  expect(simple(l, { geometry: "none" })).toContain(
    "componentPropertyDefinitions"
  );
  expect(fast(l, { geometry: "none" })).toContain(
    "componentPropertyDefinitions"
  );
});

test.each(TestMatrix)(
  "component that has other parent allows componentPropertyDefinitions ($name) geom = $opts.geometry",
  ({ fn, opts }) => {
    const l = { type: "COMPONENT", parent: { type: "FRAME" } };
    expect(fn(l, opts)).not.toContain("componentPropertyDefinitions");
  }
);

test.each(TestMatrix)(
  "random layer excludes componentPropertyDefinitions ($name) geom = $opts.geometry",
  ({ fn, opts }) => {
    const l = { type: "STAR", parent: { type: "FRAME" } };
    expect(fn(l, opts)).toContain("componentPropertyDefinitions");
  }
);
