import { HeroSection } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, BookOpen } from "lucide-react";
import Link from "next/link";

const features = [
	{
		title: "Hono Foundation",
		description:
			"Built on top of Hono's ultra-fast runtime, ensuring optimal performance for your RPC services.",
		icon: "⚡",
	},
	{
		title: "Type Safety",
		description:
			"End-to-end TypeScript support with automatic type inference for both client and server.",
		icon: "🔒",
	},
	{
		title: "WebSocket Integration",
		description:
			"Seamless WebSocket support through Cloudflare for real-time communication.",
		icon: "🌐",
	},
	{
		title: "Next.js Ready",
		description:
			"Perfect integration with Next.js applications, both inside and outside the framework.",
		icon: "⚛️",
	},
	{
		title: "Minimal Setup",
		description:
			"Get started quickly with minimal configuration and sensible defaults.",
		icon: "🚀",
	},
	{
		title: "Developer Experience",
		description:
			"Excellent DX with hot reloading, error handling, and comprehensive documentation.",
		icon: "💻",
	},
];

export default function Home() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-sand-50/10 via-background to-sand-100/10 dark:from-sand-950/10 dark:via-background dark:to-sand-900/10">
			{/* Hero Section - now inherits the page background */}
			<div className="relative">
				<HeroSection />
			</div>

			{/* Quick Start Section - now inherits the page background */}
			<section className="py-24 px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
							Get Started in Minutes
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							JSandy makes it incredibly easy to build type-safe RPC services
							with minimal setup.
						</p>
					</div>

					<div className="text-center mt-12">
						<Button
							asChild
							size="lg"
							className="bg-sand-600 hover:bg-sand-700 dark:bg-sand-500 dark:hover:bg-sand-600"
						>
							<Link href="/docs">
								Read Full Documentation
								<BookOpen className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Features Section - now inherits the page background */}
			<section className="py-24 px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
							Why Choose JSandy?
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Built for modern web development with performance and developer
							experience in mind.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<div
								key={feature.title}
								className="glass rounded-2xl p-6 animate-slide-up border! border-sand-200! dark:border-sand-800/10!"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								<div className="text-3xl mb-4">{feature.icon}</div>
								<h3 className="text-xl font-semibold text-foreground mb-2">
									{feature.title}
								</h3>
								<p className="text-muted-foreground">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section - now inherits the page background */}
			<section className="py-24 px-6 lg:px-8">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
						Ready to Build Amazing RPC Services?
					</h2>
					<p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
						Join the growing community of developers using JSandy to build fast,
						type-safe, and scalable RPC networks.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button
							asChild
							size="lg"
							className="bg-sand-600 hover:bg-sand-700 dark:bg-sand-500 dark:hover:bg-sand-600"
						>
							<Link href="/docs">
								Get Started
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link href="https://github.com/JacobDevelops/jsandy">
								<Github className="mr-2 h-4 w-4" />
								View on GitHub
							</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
