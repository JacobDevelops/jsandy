"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
	code: string;
}

export function CopyButton({ code, className, ...props }: CopyButtonProps) {
	const [hasCopied, setHasCopied] = useState(false);

	const copyToClipboard = async () => {
		await navigator.clipboard.writeText(code);
		setHasCopied(true);
		setTimeout(() => {
			setHasCopied(false);
		}, 2000);
	};

	return (
		<Button
			size="icon"
			variant="ghost"
			className={cn(
				"h-7 w-7 text-muted-foreground hover:bg-sand-100 dark:hover:bg-sand-800 hover:text-foreground",
				className,
			)}
			onClick={copyToClipboard}
			{...props}
		>
			<span className="sr-only">Copy</span>
			{hasCopied ? (
				<Check className="h-4 w-4 text-green-500" />
			) : (
				<Copy className="h-4 w-4" />
			)}
		</Button>
	);
}
