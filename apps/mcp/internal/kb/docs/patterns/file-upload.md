# File Upload Pattern

Handle file uploads via mutation procedures using FormData.

## Upload Mutation

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";

const { procedure } = jsandy.init();

const uploadFile = procedure
	.use(authMiddleware)
	.input(z.object({
		filename: z.string(),
		contentType: z.string(),
		size: z.number().int().max(10 * 1024 * 1024),
	}))
	.output(z.object({
		id: z.string(),
		url: z.string(),
		filename: z.string(),
		size: z.number(),
	}))
	.describe({ description: "Upload a file" })
	.mutation(async ({ c, ctx, input }) => {
		const body = await c.req.parseBody();
		const file = body["file"];

		if (\!(file instanceof File)) {
			throw new HTTPException(400, { message: "No file provided" });
		}

		if (file.size > 10 * 1024 * 1024) {
			throw new HTTPException(400, { message: "File too large (max 10MB)" });
		}

		const buffer = await file.arrayBuffer();
		const result = await storage.upload({
			data: Buffer.from(buffer),
			filename: input.filename,
			contentType: input.contentType,
			userId: ctx.user.id,
		});

		return c.superjson({
			id: result.id,
			url: result.url,
			filename: input.filename,
			size: file.size,
		});
	});

export { uploadFile };
```

## Client-Side Upload

```typescript
const formData = new FormData();
formData.append("file", selectedFile);

const result = await fetch("/api/uploadFile", {
	method: "POST",
	body: formData,
	headers: {
		Authorization: `Bearer ${token}`,
	},
});
const data = await result.json();
```

## Validation

Validate file type and size before processing:

```typescript
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

if (\!allowedTypes.includes(input.contentType)) {
	throw new HTTPException(400, {
		message: `Unsupported file type. Allowed: ${allowedTypes.join(", ")}`,
	});
}
```
