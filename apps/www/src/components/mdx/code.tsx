import { CopyButton } from "@/components/copy-button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Code2, FileJson2, TerminalSquare } from "lucide-react";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

async function highlightCode(code: string) {
	const file = await unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypePrettyCode)
		.use(rehypeStringify)
		.process(code);

	return String(file);
}

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
		language === "bash" || language === "shell" || language === "sh"
			? TerminalSquare
			: language === "typescript" || language === "ts" || language === "tsx"
				? FileJson2
				: Code2;

	return (
		<div className="my-6 border border-border rounded-lg glass overflow-hidden">
			{title ? (
				<div className="flex items-center justify-between py-2.5 px-4 bg-sand-50 dark:bg-sand-800/30 border-b border-border">
					<div className="flex items-center gap-2">
						{Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
						<p className="text-sm font-medium text-foreground">{title}</p>
					</div>
					<CopyButton code={code} />
				</div>
			) : (
				<div className="absolute right-3 top-3 z-10">
					<CopyButton code={code} />
				</div>
			)}
			<ScrollArea className="relative">
				<div
					className={cn(
						"p-4 w-full text-sm",
						title ? "rounded-b-md" : "rounded-md",
					)}
				>
					<pre className="!bg-transparent !p-0 overflow-x-visible">
						<code
							className={`language-${language} !bg-transparent`}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: We need to set the inner HTML here
							dangerouslySetInnerHTML={{
								__html: highlightedCode,
							}}
						/>
					</pre>
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>
		</div>
	);
}
