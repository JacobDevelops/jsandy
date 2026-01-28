# defaults

Pre-configured middleware and handlers from `jsandy.init()`.

## Available Defaults

```typescript
const { defaults } = jsandy.init();
```

| Property | Type | Description |
|----------|------|-------------|
| `defaults.cors` | Middleware | CORS handler with permissive defaults |
| `defaults.errorHandler` | ErrorHandler | Formats errors as JSON with status codes |

## CORS

```typescript
const app = new Hono();
app.use(defaults.cors);
```

Configures CORS with:
- All origins allowed (customize in production)
- Standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- Common headers (Content-Type, Authorization)

## Error Handler

```typescript
app.onError(defaults.errorHandler);
```

Formats errors as structured JSON responses:

```json
{
  "error": {
    "message": "Not found",
    "code": "NOT_FOUND"
  }
}
```

## Usage Pattern

Always apply both to your Hono app before mounting routers:

```typescript
const app = new Hono().basePath("/api");
app.use(defaults.cors);
app.onError(defaults.errorHandler);
app.route("/", appRouter);
```
