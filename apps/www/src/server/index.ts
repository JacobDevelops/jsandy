import type { InferRouterOutputs } from "@jsandy/rpc";
import { j } from "./jsandy";
import { searchRouter } from "./routers/search-router";
import { stargazersRouter } from "./routers/stargazers-router";

export const api = j
	.router()
	.basePath("/api")
	.use(j.defaults.cors)
	.onError(j.defaults.errorHandler);

const appRouter = j.mergeRouters(api, {
	search: searchRouter,
	stargazers: stargazersRouter,
});

export type AppRouter = typeof appRouter;
export default appRouter;

export type InferOutput = InferRouterOutputs<AppRouter>;
