import { j } from "./jsandy.mock";

export const authMiddleware = j.middleware(async ({ next, c }) => {
	const token = c.req.header("authorization");
	if (!token) {
		throw new Error("Unauthorized");
	}
	const user = { id: "user-123", name: "Test User" };
	return next({ user });
});

export const loggingMiddleware = j.middleware(async ({ next, c }) => {
	console.log(`${c.req.method} ${c.req.url}`);
	const start = Date.now();
	const result = await next();
	console.log(`Request completed in ${Date.now() - start}ms`);
	return result;
});
