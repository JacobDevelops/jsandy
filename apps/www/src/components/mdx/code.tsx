import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import { Icons } from "../icons";
import { CopyButton } from "../copy-button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * Server Component example
 */

export async function Code({
	title,
	language,
	code,
}: {
	title?: string;
	language: string;
	code: string;
}) {
	const highlightedCode = await highlightCode(code);

	const Icon =
		language === "bash"
			? Icons.terminal
			: language === "ts" || language === "tsx"
				? Icons.typescript
				: () => null;

	return (
		<div className="border border-dark-gray rounded-md">
			{title ? (
				<div className="rounded-t-md flex items-center justify-between py-3 px-4 bg-sand-900 dark:bg-sand-100 border-b border-dark-gray">
					<div className="flex items-center gap-2.5">
						{Icon && <Icon className="grayscale size-4" />}
						<p className="text-sm font-medium text-muted-foreground">{title}</p>
					</div>
					<CopyButton code={code} />
				</div>
			) : null}
			<ScrollArea className="">
				<div
					className={cn(
						"relative py-3 w-full bg-[#22272e] px-4 rounded-md antialiased",
						{
							"rounded-t-none": Boolean(title),
						},
					)}
				>
					{!title && (
						<div className="absolute right-2 top-2">
							<CopyButton code={code} />
						</div>
					)}
					<section
						// biome-ignore lint/security/noDangerouslySetInnerHtml: We need to set the inner HTML here
						dangerouslySetInnerHTML={{
							__html: highlightedCode,
						}}
					/>
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}

async function highlightCode(code: string) {
	const file = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypePrettyCode)
		.use(rehypeStringify)
		.process(code);

	return String(file);
}
