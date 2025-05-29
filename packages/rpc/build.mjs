import pkg from "@jsandy/builder";
const { build } = pkg;

build("src/index.ts", ["hono", "superjson", "zod"]);
