export const fromEntries = <V>(e: [string, V][]): { [key: string]: V } => {
  const o: { [key: string]: V } = {};
  e.forEach(([k, v]) => {
    o[k] = v;
  });
  return o;
};
