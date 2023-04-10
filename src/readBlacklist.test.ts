import { Options } from ".";
import {
  conditionalReadBlacklist as fast,
  conditionalReadBlacklistSimple as simple,
} from "./readBlacklist";

const TestMatrix: {
  name: string;
  fn: typeof simple | typeof fast;
  opts: Pick<Options, "geometry">;
}[] = [
  { name: "simple", fn: simple, opts: { geometry: "none" } },
  { name: "fast", fn: fast, opts: { geometry: "none" } },
  { name: "simple", fn: simple, opts: { geometry: "paths" } },
  { name: "fast", fn: fast, opts: { geometry: "paths" } },
];

test.each(TestMatrix)(
  "text layer never has fillGeometry because too many points ($name) geom = $opts.geometry",
  ({ fn, opts }) => {
    const l = { type: "TEXT" };
    expect(fn(l, opts)).toContain("fillGeometry");
  },
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
  },
);

test("component that has component set parent doesn't allow componentPropertyDefinitions", () => {
  const l = { type: "COMPONENT", parent: { type: "COMPONENT_SET" } };
  expect(simple(l, { geometry: "none" })).toContain(
    "componentPropertyDefinitions",
  );
  expect(fast(l, { geometry: "none" })).toContain(
    "componentPropertyDefinitions",
  );
});

test.each(TestMatrix)(
  "component that has other parent allows componentPropertyDefinitions ($name) geom = $opts.geometry",
  ({ fn, opts }) => {
    const l = { type: "COMPONENT", parent: { type: "FRAME" } };
    expect(fn(l, opts)).not.toContain("componentPropertyDefinitions");
  },
);

test.each(TestMatrix)(
  "random layer excludes componentPropertyDefinitions ($name) geom = $opts.geometry",
  ({ fn, opts }) => {
    const l = { type: "STAR", parent: { type: "FRAME" } };
    expect(fn(l, opts)).toContain("componentPropertyDefinitions");
  },
);

describe("exclude deprecated background properties for all nodes but page", () => {
  test.each(TestMatrix)(
    "page has background properties ($name) geom = $opts.geometry",
    ({ fn, opts }) => {
      const l = { type: "PAGE" };
      expect(fn(l, opts)).not.toContain("backgrounds");
      expect(fn(l, opts)).not.toContain("backgroundStyleId");
    },
  );

  test.each(TestMatrix)(
    "non-page nodes don't have background properties ($name) geom = $opts.geometry",
    ({ fn, opts }) => {
      const t = { type: "TEXT" };
      expect(fn(t, opts)).toContain("backgrounds");
      expect(fn(t, opts)).toContain("backgroundStyleId");

      const cs = { type: "COMPONENT_SET" };
      expect(fn(cs, opts)).toContain("backgrounds");
      expect(fn(cs, opts)).toContain("backgroundStyleId");

      const f = { type: "FRAME" };
      expect(fn(f, opts)).toContain("backgrounds");
      expect(fn(f, opts)).toContain("backgroundStyleId");
    },
  );
});
