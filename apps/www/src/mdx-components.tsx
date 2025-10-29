import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "./lib/slugify";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		...components,
		Image: ({ src, alt, width, height }) => (
			<div className="relative w-full h-full">
				<Image
					src={src}
					alt={alt || ""}
					width={width ?? 800}
					height={height ?? 400}
					className="w-full h-full object-cover"
					quality={95}
				/>
			</div>
		),
		Frame: ({ children }) => (
			<div className="inline-block w-full h-full rounded-xl p-2 ring-1 ring-inset ring-zinc-700 bg-zinc-500/10 lg:rounded-2xl lg:p-3 my-8">
				<div className="rounded-lg w-full h-full overflow-hidden">
					{children}
				</div>
			</div>
		),
		p: ({ children }) => (
			<p className="text-muted-foreground text-base/7">{children}</p>
		),
		pre: ({ ref: _ref, ...props }) => (
			<CodeBlock {...props}>
				<Pre>{props.children}</Pre>
			</CodeBlock>
		),
		strong: ({ children, ...props }) => {
			return (
				<b className="text-muted-light font-semibold" {...props}>
					{children}
				</b>
			);
		},
		hr: () => (
			<div className="py-6">
				<hr className="border-none h-0.5 bg-[#2e2e32]" />
			</div>
		),
		code: (props) => {
			return (
				<code className="font-mono px-1.5 py-0.5 text-sand-400 dark:text-sand-600 rounded">
					{props.children}
				</code>
			);
		},
		a: ({ children, ...props }) => {
			return (
				<Link
					className="inline underline underline-offset-4 text-muted-light font-medium"
					href={props.href ?? "#"}
					target="_blank"
					rel="noopener noreferrer"
					{...props}
				>
					{children}
				</Link>
			);
		},
		ul: ({ children }) => (
			<ul className="list-disc list-inside space-y-2 text-muted-foreground">
				{children}
			</ul>
		),
		ol: ({ children }) => (
			<ol className="list-decimal ml-5 space-y-8 text-muted-foreground">
				{children}
			</ol>
		),
		li: ({ children }) => (
			<li className="text-base/7 pl-1 space-y-6">{children}</li>
		),
		h1: ({ children }) => {
			const title = children?.toString() || "";
			const slug = slugify(title.toLowerCase());

			return (
				<h1
					id={slug}
					className="relative scroll-mt-44 lg:scroll-mt-32 text-muted-light text-4xl tracking-tight font-medium"
				>
					{children}
				</h1>
			);
		},
		h2: ({ children }) => {
			const title = children?.toString() || "";
			const slug = slugify(title.toLowerCase());

			return (
				<h2
					id={slug}
					className="relative scroll-mt-44 lg:scroll-mt-32 text-muted-light text-3xl tracking-tight font-medium"
				>
					{children}
				</h2>
			);
		},
		h3: ({ children }) => {
			const title = children?.toString() || "";
			const slug = slugify(title.toLowerCase());

			return (
				<h3
					id={slug}
					className="relative scroll-mt-44 lg:scroll-mt-32 text-muted-light text-xl tracking-tight font-medium"
				>
					{children}
				</h3>
			);
		},
	};
}
