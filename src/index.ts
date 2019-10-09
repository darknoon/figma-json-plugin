const blacklist = new Set(["parent", "__proto__"]);

export default function dump(n: SceneNode): any {
  type AnyObject = { [name: string]: any };
  const _dumpObject = (n: AnyObject, keys: string[]) =>
    keys.reduce(
      (o, k) => {
        o[k] = _dump(n[k]);
        return o;
      },
      {} as AnyObject
    );

  const _dump = (n: any): any => {
    switch (typeof n) {
      case "object": {
        if (Array.isArray(n)) {
          return n.map(v => _dump(v));
        } else if (n.__proto__ !== undefined) {
          // Merge keys from __proto__ with natural keys
          const keys = [...Object.keys(n), ...Object.keys(n.__proto__)].filter(
            k => !blacklist.has(k)
          );
          return _dumpObject(n, keys);
        } else {
          const keys = Object.keys(n);
          return _dumpObject(n, keys);
        }
      }
      case "function":
        return undefined;
      //   case "symbol":
      //     return n.description;
      default:
        return n;
    }
  };
  return _dump(n);
}
