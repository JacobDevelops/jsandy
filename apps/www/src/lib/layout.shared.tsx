import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
	return {
		githubUrl: "https://github.com/JacobDevelops/jsandy",
		nav: {
			title: (
				<>
					<Image
						alt="JSandy Logo"
						className="h-6 w-6 text-sand-600 dark:text-sand-400"
						height={512}
						src="/logo.png"
						width={512}
					/>
					<div className="flex items-baseline gap-1.5">
						<p className="font-semibold tracking-tight text-foreground">
							JSandy
						</p>
						<p className="text-sm text-muted-foreground">docs</p>
					</div>
				</>
			),
		},
	};
}
