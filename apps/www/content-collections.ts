import { rehypeParseCodeBlocks } from "@/lib/shiki-rehype";
import { slugify } from "@/lib/slugify";
import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { z } from "zod";

// for more information on configuration, visit:
// https://www.content-collections.dev/docs/configuration

const docs = defineCollection({
	name: "docs",
	directory: "src/docs",
	include: ["**/*.md", "**/*.mdx"],
	schema: z.object({
		title: z.string(),
		summary: z.string(),
	}),
	transform: async (document, context) => {
		const mdx = await compileMDX(context, document, {
			rehypePlugins: [
				rehypeParseCodeBlocks,
				[
					rehypeAutolinkHeadings,
					{
						properties: {
							className: ["anchor"],
						},
					},
				],
			],
		});

		const regXHeader = /^(?:[\n\r]|)(?<flag>#{1,6})\s+(?<content>.+)/gm;
		const headings = Array.from(document.content.matchAll(regXHeader)).map(
			({ groups }) => {
				const flag = groups?.flag;
				const content = groups?.content;
				return {
					level: flag?.length,
					text: content,
					slug: slugify(content ?? "#"),
				};
			},
		);

		return {
			...document,
			headings,
			mdx,
		};
	},
});

export default defineConfig({
	collections: [docs],
});
