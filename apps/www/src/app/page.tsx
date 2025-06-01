import { HeroSection } from "@/components/hero-section";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, BookOpen } from "lucide-react";
import Link from "next/link";

export default function Home() {
	return (
		<div className="min-h-screen">
			{/* Hero Section with gradient background */}
			<div className="relative bg-gradient-to-br from-background via-sand-50/30 to-sand-100/50 dark:from-background dark:via-sand-950/30 dark:to-sand-900/50">
				<HeroSection />
			</div>

			{/* Smooth transition gradient */}
			<div className="h-32 bg-gradient-to-b from-sand-100/50 via-sand-50/20 to-background dark:from-sand-900/50 dark:via-sand-950/20 dark:to-background" />

			{/* Quick Start Section */}
			<section className="py-24 px-6 lg:px-8 bg-background">
				<div className="mx-auto max-w-7xl">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
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

			{/* Smooth transition to features section */}
			<div className="h-24 bg-gradient-to-b from-background to-muted/30" />

			{/* Features Section */}
			<section className="py-24 px-6 lg:px-8 bg-muted/30">
				<div className="mx-auto max-w-7xl">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
							Why Choose JSandy?
						</h2>
						<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
							Built for modern web development with performance and developer
							experience in mind.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{[
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
						].map((feature, index) => (
							<div
								key={feature.icon}
								className="glass rounded-2xl p-6 animate-slide-up"
								style={{ animationDelay: `${index * 0.1}s` }}
							>
								<div className="text-3xl mb-4">{feature.icon}</div>
								<h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
								<p className="text-muted-foreground">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Smooth transition to CTA section */}
			<div className="h-24 bg-gradient-to-b from-muted/30 via-sand-50/20 to-sand-100/30 dark:from-muted/30 dark:via-sand-950/20 dark:to-sand-900/30" />

			{/* CTA Section with gradient background */}
			<section className="py-24 px-6 lg:px-8 bg-gradient-to-br from-sand-100/30 via-sand-50/20 to-background dark:from-sand-900/30 dark:via-sand-950/20 dark:to-background">
				<div className="mx-auto max-w-4xl text-center">
					<h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
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
							<Link href="https://github.com/yourusername/jsandy">
								<Github className="mr-2 h-4 w-4" />
								View on GitHub
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Final smooth transition to footer */}
			<div className="h-16 bg-gradient-to-b from-sand-100/30 to-background dark:from-sand-900/30 dark:to-background" />
		</div>
	);
}
