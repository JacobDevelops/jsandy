# router

Group procedures into a named, typed router.

## Creating a Router

```typescript
import { jsandy } from "@jsandy/rpc";

const { procedure, router } = jsandy.init();

const getUser = procedure.query(/* ... */);
const createUser = procedure.mutation(/* ... */);

export const userRouter = router({
  getUser,
  createUser,
});

// Export the type for client usage
export type UserRouter = typeof userRouter;
```

## Router Configuration

```typescript
const myRouter = router({
  getUser,
  createUser,
}).config({
  basePath: "/users",
  getPubSubAdapter: () => pubsubAdapter,
});
```

## Nesting Routers

Routers can be nested by including them in another router:

```typescript
const appRouter = router({
  users: userRouter,
  posts: postRouter,
});
```

## Important Notes

- Every router must have at least one procedure registered
- Export the router type (`typeof myRouter`) for type-safe client usage
- Router names become the URL path segments
- An empty `router({})` is an anti-pattern — always register procedures
