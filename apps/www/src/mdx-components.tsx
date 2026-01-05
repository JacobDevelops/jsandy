import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "./lib/slugify";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return {
		...defaultMdxComponents,
		...components,
		a: ({ children, ...props }) => {
			return (
				<Link
					className="inline underline underline-offset-4 text-muted-light font-medium"
					href={props.href ?? "#"}
					rel="noopener noreferrer"
					target="_blank"
					{...props}
				>
					{children}
				</Link>
			);
		},
		code: (props) => {
			return (
				<code className="font-mono px-1.5 py-0.5 text-sand-400 dark:text-sand-600 rounded">
					{props.children}
				</code>
			);
		},
		Frame: ({ children }) => (
			<div className="inline-block w-full h-full rounded-xl p-2 ring-1 ring-inset ring-zinc-700 bg-zinc-500/10 lg:rounded-2xl lg:p-3 my-8">
				<div className="rounded-lg w-full h-full overflow-hidden">
					{children}
				</div>
			</div>
		),
		h1: ({ children }) => {
			const title = children?.toString() || "";
			const slug = slugify(title.toLowerCase());

			return (
				<h1
					className="relative scroll-mt-44 lg:scroll-mt-32 text-muted-light text-4xl tracking-tight font-medium"
					id={slug}
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
					className="relative scroll-mt-44 lg:scroll-mt-32 text-muted-light text-3xl tracking-tight font-medium"
					id={slug}
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
					className="relative scroll-mt-44 lg:scroll-mt-32 text-muted-light text-xl tracking-tight font-medium"
					id={slug}
				>
					{children}
				</h3>
			);
		},
		hr: () => (
			<div className="py-6">
				<hr className="border-none h-0.5 bg-[#2e2e32]" />
			</div>
		),
		Image: ({ src, alt, width, height }) => (
			<div className="relative w-full h-full">
				<Image
					alt={alt || ""}
					className="w-full h-full object-cover"
					height={height ?? 400}
					quality={95}
					src={src}
					width={width ?? 800}
				/>
			</div>
		),
		li: ({ children }) => (
			<li className="text-base/7 pl-1 space-y-6">{children}</li>
		),
		ol: ({ children }) => (
			<ol className="list-decimal ml-5 space-y-8 text-muted-foreground">
				{children}
			</ol>
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
		ul: ({ children }) => (
			<ul className="list-disc list-inside space-y-2 text-muted-foreground">
				{children}
			</ul>
		),
	};
}
