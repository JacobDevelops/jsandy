import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<>
					<Image
						src="/logo.png"
						height={512}
						width={512}
						alt="JSandy Logo"
						className="h-6 w-6 text-sand-600 dark:text-sand-400"
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
		githubUrl: "https://github.com/JacobDevelops/jsandy",
	};
}
