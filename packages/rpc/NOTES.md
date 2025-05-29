# NOTES

## AppRouter

```ts
// Target
type AppRouter = Router<InferSchemaFromRouters<{
    auth: Router<{
        test: GetOperation<void, JSONRespondReturn<{
            message: string;
        }, ContentfulStatusCode>, AppEnv>;
    }, any>;
}>, any>

// Current
type AppRouter = Router<InferSchemaFromRouters<{
    auth: Router<{
        test: GetOperation<void, JSONRespondReturn<{
            message: string;
        }, ContentfulStatusCode>, AppEnv>;
    }, AppEnv>;
}, AppEnv>, AppEnv>
```
