import { parseObjectPath } from "@lucid-softworks/object-path-parse";

export type ObjectPath = string | readonly PropertyKey[];

const unsafeSegments = new Set(["__proto__", "prototype", "constructor"]);

export class UnsafeObjectPathError extends Error {
  override readonly name = "UnsafeObjectPathError";
  readonly segment: string;

  constructor(segment: string) {
    super(`Unsafe object path segment: ${segment}`);
    this.segment = segment;
  }
}

/** Immutably set a path while rejecting prototype-pollution segments. */
export function setPath(
  source: unknown,
  path: ObjectPath,
  value: unknown,
): unknown {
  const segments = typeof path === "string" ? parseObjectPath(path) : [...path];

  for (const segment of segments) {
    if (typeof segment === "string" && unsafeSegments.has(segment)) {
      throw new UnsafeObjectPathError(segment);
    }

    if (
      typeof segment === "number" &&
      (!Number.isSafeInteger(segment) || segment < 0)
    ) {
      throw new RangeError(
        "numeric path segments must be non-negative safe integers",
      );
    }
  }

  return setAt(source, segments, 0, value);
}

function setAt(
  current: unknown,
  segments: readonly PropertyKey[],
  index: number,
  value: unknown,
): unknown {
  if (index === segments.length) {
    return value;
  }

  const key = segments[index] as PropertyKey;
  const isContainer =
    current !== null &&
    (typeof current === "object" || typeof current === "function");
  const existing =
    isContainer && Object.hasOwn(current, key)
      ? Reflect.get(current, key)
      : undefined;
  const child = setAt(existing, segments, index + 1, value);
  const output: Record<PropertyKey, unknown> | unknown[] = isContainer
    ? copyEnumerable(current)
    : typeof key === "number"
      ? []
      : {};

  Object.defineProperty(output, key, {
    configurable: true,
    enumerable: true,
    value: child,
    writable: true,
  });
  return output;
}

function copyEnumerable(
  source: object,
): Record<PropertyKey, unknown> | unknown[] {
  const output: Record<PropertyKey, unknown> | unknown[] = Array.isArray(source)
    ? []
    : {};

  for (const key of Reflect.ownKeys(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key)) {
      Object.defineProperty(output, key, {
        configurable: true,
        enumerable: true,
        value: Reflect.get(source, key),
        writable: true,
      });
    }
  }

  return output;
}
