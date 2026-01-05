import { desc } from "drizzle-orm";
import { z } from "zod";
import { posts } from "@/server/db/schema";
import { j, publicProcedure } from "../jsandy";

export const postRouter = j.router({
	create: publicProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ ctx, c, input }) => {
			const { name } = input;
			const { db } = ctx;

			const [post] = await db.insert(posts).values({ name }).returning();

			return c.superjson(post);
		}),
	recent: publicProcedure.query(async ({ c, ctx }) => {
		const { db } = ctx;

		const [recentPost] = await db
			.select()
			.from(posts)
			.orderBy(desc(posts.createdAt))
			.limit(1);

		return c.superjson(recentPost ?? null);
	}),
});
