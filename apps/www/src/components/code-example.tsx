"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CodeExampleProps {
	title: string;
	code: string;
	language?: string;
}

export function CodeExample({
	title,
	code,
	language = "typescript",
}: CodeExampleProps) {
	const [copied, setCopied] = useState(false);

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="glass rounded-2xl overflow-hidden">
			<div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
				<h3 className="text-lg font-semibold">{title}</h3>
				<Button
					variant="ghost"
					size="sm"
					onClick={copyToClipboard}
					className="h-8 w-8 p-0"
				>
					{copied ? (
						<Check className="h-4 w-4 text-green-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</Button>
			</div>
			<pre className="p-6 overflow-x-auto text-sm">
				<code className="text-foreground">{code}</code>
			</pre>
		</div>
	);
}
