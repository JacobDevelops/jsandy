# c.superjson()

Return typed, serialized responses from procedure handlers.

## Usage

```typescript
const getUser = procedure
  .query(async ({ c }) => {
    return c.superjson({
      id: "123",
      name: "Alice",
      createdAt: new Date(),
    });
  });
```

## Why superjson?

`c.superjson()` uses SuperJSON serialization which supports:

- `Date` objects (serialized/deserialized automatically)
- `Map` and `Set` instances
- `BigInt` values
- `undefined` values
- Regular expressions
- Custom class instances (with transformer registration)

## Compared to c.json()

| Feature | `c.json()` | `c.superjson()` |
|---------|-----------|-----------------|
| Date handling | Converted to string | Preserved as Date |
| Map/Set | Lost | Preserved |
| BigInt | Error | Preserved |
| Type safety | Basic | Full round-trip |

## Important Notes

- Always use `c.superjson()` instead of `c.json()` for @jsandy/rpc procedures
- The client automatically deserializes superjson responses
- Output schema validation runs on the superjson data before serialization
