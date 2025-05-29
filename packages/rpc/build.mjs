import pkg from "@squaredmade/builder";
const { build } = pkg;

build("src/index.ts", [
	"hono",
	"@squaredmade/logger",
	"@squaredmade/superjson",
	"zod",
]);
