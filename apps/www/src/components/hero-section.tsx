"use client";

import { ArrowRight, Code, Globe, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DECORATIVE_CLIP_PATH =
	"polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)";

export function HeroSection() {
	return (
		<div className="relative isolate px-6 pt-14 lg:px-8">
			{/* Background gradient */}
			<div
				aria-hidden="true"
				className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
			>
				<div
					className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-sand-400 to-sand-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
					style={{
						clipPath: DECORATIVE_CLIP_PATH,
					}}
				/>
			</div>

			<div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
				<div className="text-center animate-fade-in">
					<div className="mb-8 flex justify-center">
						<div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-sand-500/20 transition-all duration-300">
							Built on top of Hono for maximum performance.{" "}
							<Link
								className="font-semibold text-sand-600 dark:text-sand-400"
								href="/docs"
							>
								<span aria-hidden="true" className="absolute inset-0" />
								Read the docs <span aria-hidden="true">&rarr;</span>
							</Link>
						</div>
					</div>

					<h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl animate-slide-up">
						Build{" "}
						<span className="bg-gradient-to-r from-sand-600 via-sand-500 to-sand-700 dark:from-sand-400 dark:via-sand-300 dark:to-sand-500 bg-clip-text text-transparent">
							RPC Networks
						</span>{" "}
						with Ease
					</h1>

					<p
						className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto animate-slide-up"
						style={{ animationDelay: "0.1s" }}
					>
						JSandy is a cutting-edge RPC service framework that wraps around
						Hono, enabling seamless RPC networks within and outside of Next.js
						applications with integrated WebSocket support.
					</p>

					<div
						className="mt-10 flex items-center justify-center gap-x-6 animate-slide-up"
						style={{ animationDelay: "0.2s" }}
					>
						<Button
							asChild
							className="bg-sand-600 hover:bg-sand-700 dark:bg-sand-500 dark:hover:bg-sand-600"
							size="lg"
						>
							<Link href="/docs">
								Get Started
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<Button asChild size="lg" variant="outline">
							<Link href="/examples">View Examples</Link>
						</Button>
					</div>
				</div>

				{/* Feature cards */}
				<div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-3">
					<FeatureCard
						description="Built on Hono's blazing-fast runtime for optimal performance"
						icon={<Zap className="h-6 w-6 text-sand-600 dark:text-sand-400" />}
						title="Lightning Fast"
					/>
					<FeatureCard
						description="Full TypeScript support with end-to-end type safety"
						icon={<Code className="h-6 w-6 text-sand-600 dark:text-sand-400" />}
						title="Type Safe"
					/>
					<FeatureCard
						description="Integrated WebSocket support through Cloudflare"
						icon={
							<Globe className="h-6 w-6 text-sand-600 dark:text-sand-400" />
						}
						title="WebSocket Ready"
					/>
				</div>
			</div>

			{/* Bottom gradient */}
			<div
				aria-hidden="true"
				className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
			>
				<div
					className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-sand-400 to-sand-600 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
					style={{
						clipPath: DECORATIVE_CLIP_PATH,
					}}
				/>
			</div>
		</div>
	);
}

function FeatureCard({
	title,
	description,
	icon,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
}) {
	return (
		<div
			className="glass rounded-2xl p-6 text-center animate-slide-up"
			style={{ animationDelay: "0.5s" }}
		>
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-sand-500/10">
				{icon}
			</div>
			<h3 className="mt-4 text-lg font-semibold">{title}</h3>
			<p className="mt-2 text-sm text-muted-foreground">{description}</p>
		</div>
	);
}
