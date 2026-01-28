# Zod v4 Constraints

`@jsandy/rpc` requires Zod v4. Several v3 APIs have been removed or changed.

## Deprecated Patterns (DO NOT USE)

These Zod v3 patterns are removed in v4 and must not appear in `@jsandy/rpc` code:

| Removed (v3) | Replacement (v4) |
|---|---|
| `z.nativeEnum(MyEnum)` | `z.enum([...])` or `z.union([z.literal(...), ...])` |
| `.strict()` | Removed — objects are strict by default in v4 |
| `.passthrough()` | Removed — use `z.object({}).catchall(z.unknown())` if needed |
| `.strip()` | Removed — default behavior in v4 |
| `.merge(otherSchema)` | Use `z.object({ ...a.shape, ...b.shape })` or spread |
| `z.promise(schema)` | Removed — validate the resolved value directly |
| `z.ostring()` | `z.optional(z.string())` |
| `z.onumber()` | `z.optional(z.number())` |
| `z.oboolean()` | `z.optional(z.boolean())` |
| `.deepPartial()` | Removed — use recursive `z.optional()` or custom utility |
| `Schema.create()` | Use schema constructors directly: `z.string()`, `z.number()` |

## Correct v4 Patterns

### Enums

```typescript
// WRONG — z.nativeEnum is removed
// enum Role { Admin = "admin", User = "user" }
// z.nativeEnum(Role)

// CORRECT
z.enum(["admin", "user"])
```

### Optional Fields

```typescript
// WRONG — shorthand removed
// z.ostring()

// CORRECT
z.optional(z.string())
```

### Object Composition

```typescript
// WRONG — .merge() removed from objects
// schemaA.merge(schemaB)

// CORRECT
z.object({
	...schemaA.shape,
	...schemaB.shape,
})
```

### Strict Objects

```typescript
// WRONG — .strict() removed (default in v4)
// z.object({ name: z.string() }).strict()

// CORRECT — objects are strict by default
z.object({ name: z.string() })

// To allow extra keys:
z.object({ name: z.string() }).catchall(z.unknown())
```

### Promises

```typescript
// WRONG — z.promise() removed
// z.promise(z.string())

// CORRECT — validate the resolved value in your handler
const result = await myAsyncFn();
// validate result with your schema
```

## Migration Checklist

1. Replace all `z.nativeEnum()` with `z.enum([])`
2. Replace `.strict()` — remove it (default in v4)
3. Replace `.passthrough()` — remove or use `.catchall()`
4. Replace `.merge()` — use spread with `.shape`
5. Replace `z.promise()` — validate resolved values
6. Replace `z.ostring()` / `z.onumber()` / `z.oboolean()` with `z.optional()`
7. Remove `.deepPartial()` — build custom partial schemas
8. Replace `Schema.create()` — use `z.string()` etc. directly
