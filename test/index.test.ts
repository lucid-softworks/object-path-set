import { describe, expect, it } from "vitest";

import { setPath, UnsafeObjectPathError } from "../src/index.js";

describe("setPath", () => {
  it("immutably updates existing object and array branches", () => {
    const source = { items: [{ name: "old", retained: true }], untouched: {} };
    const result = setPath(source, "items[0].name", "new") as typeof source;

    expect(result).toEqual({
      items: [{ name: "new", retained: true }],
      untouched: {},
    });
    expect(result).not.toBe(source);
    expect(result.items).not.toBe(source.items);
    expect(result.items[0]).not.toBe(source.items[0]);
    expect(result.untouched).toBe(source.untouched);
    expect(source.items[0]?.name).toBe("old");
  });

  it("creates missing containers and supports symbols", () => {
    const symbol = Symbol("value");
    expect(setPath({}, ["items", 0, symbol], 42)).toEqual({
      items: [{ [symbol]: 42 }],
    });
  });

  it("replaces the root for an empty path", () => {
    expect(setPath({ old: true }, "", { next: true })).toEqual({ next: true });
  });

  it.each([
    "__proto__.polluted",
    "constructor.prototype.polluted",
    "safe.__proto__",
  ])("rejects unsafe string path %j", (path) => {
    expect(() => setPath({}, path, true)).toThrow(UnsafeObjectPathError);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it("reports the unsafe segment and rejects unsafe segment arrays", () => {
    expect(() => setPath({}, ["safe", "prototype"], true)).toThrow(
      expect.objectContaining({ segment: "prototype" }),
    );
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects numeric segment %s",
    (segment) => {
      expect(() => setPath({}, [segment], true)).toThrow(RangeError);
    },
  );

  it("copies enumerable symbols but excludes hidden data", () => {
    const symbol = Symbol("retained");
    const source = { visible: 1, [symbol]: 2 };
    Object.defineProperty(source, "hidden", { value: 3 });
    const result = setPath(source, "added", 4) as Record<PropertyKey, unknown>;

    expect(result).toEqual({ visible: 1, added: 4, [symbol]: 2 });
  });
});
