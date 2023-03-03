import * as F from "./figma-json";

// We only support a subset of properties currently
export type SupportedProperties = "characters" | "opacity";

function isSupported(
  property: F.NodeChangeProperty
): property is SupportedProperties {
  return property === "characters" || property === "opacity";
}

function filterNulls<T>(arr: (T | null)[]): T[] {
  return arr.filter((n) => n !== null) as T[];
}

export function applyOverridesToChildren(
  instance: InstanceNode,
  f: F.InstanceNode
) {
  const { overrides } = f;

  // Remove overrides that aren't supported
  const supportedOverrides = filterNulls(
    overrides.map(
      ({ id, overriddenFields }): [string, SupportedProperties[]] | null => {
        const sp = overriddenFields.filter(isSupported);
        return sp.length > 0 ? [id, sp] : null;
      }
    )
  );

  // Overridden fields are keyed by node id
  const overriddenMap = new Map<string, SupportedProperties[]>(
    supportedOverrides
  );

  _recursive(instance, f, overriddenMap);
}

function _recursive(
  n: SceneNode & ChildrenMixin,
  f: F.SceneNode & F.ChildrenMixin,
  overriddenMap: Map<string, SupportedProperties[]>
) {
  // Recursively find correspondences between n's children and j's children
  if (n.children.length !== f.children.length) {
    console.warn(
      `Instance children length mismatch ${n.children.length} vs ${f.children.length}: `,
      n,
      f
    );
  }
  for (let [node, json] of zip(n.children, f.children)) {
    // Basic sanity check that we're looking at the same thing
    if (node.type !== json.type) {
      console.warn(
        `Instance children type mismatch: ${node.type} !== ${json.type}`
      );
    }
    // We know that these scene nodes correspond, so apply overrides
    _applyOverrides(node, json, overriddenMap);
    // Recurse
    if ("children" in node && "children" in json) {
      _recursive(node, json, overriddenMap);
    }
  }
}

function _applyOverrides(
  n: SceneNode,
  j: F.SceneNode,
  overriddenMap: Map<string, SupportedProperties[]>
) {
  // Do we have overrides for this node?
  const overriddenFields = overriddenMap.get(n.id)!;
  if (overriddenFields) {
    for (let property of overriddenFields) {
      console.log(
        `assigning override ${n.id}.${property} = ${j.id})${property} (${
          j[property as keyof F.SceneNode]
        })`
      );
      // @ts-expect-error We know that this property exists because we filtered it
      n[property as any] = j[property as keyof F.SceneNode];
    }
  }
}

function* zip<A, B>(a: Iterable<A>, b: Iterable<B>): IterableIterator<[A, B]> {
  let iterA = a[Symbol.iterator]();
  let iterB = b[Symbol.iterator]();
  let nextA = iterA.next();
  let nextB = iterB.next();
  while (!nextA.done && !nextB.done) {
    yield [nextA.value, nextB.value];
    nextA = iterA.next();
    nextB = iterB.next();
  }
}
