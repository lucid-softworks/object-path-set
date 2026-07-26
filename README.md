# `@lucid-softworks/object-path-set`

Immutably write through a string path or property-key segment array, cloning
only traversed branches. Missing arrays and objects are created automatically.

```ts
import { setPath } from "@lucid-softworks/object-path-set";

const next = setPath(state, "users[0].name", "Ada");
```

For prototype-pollution safety, `__proto__`, `prototype`, and `constructor`
segments throw `UnsafeObjectPathError`. Numeric segments must be non-negative
safe integers. Own enumerable string and symbol properties are copied without
assignment-based prototype mutation.
