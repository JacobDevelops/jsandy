// @ts-nocheck -- Will remove when builder is published
import { build } from "@jsandy/builder";

build("src/index.ts", ["hono", "superjson", "zod", "@jsandy/rpc/adapters"]);
build("src/rpc-client/index.ts", ["@jsandy/rpc"]);
build("src/sockets/adapters/index.ts");
