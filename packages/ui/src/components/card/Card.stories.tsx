import type { Meta, StoryObj } from "@storybook/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./Card";

const meta: Meta<typeof Card> = {
	title: "Components/Card",
	component: Card,
	tags: ["autodocs"],
	argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
	render: () => (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>Card Description</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card Content</p>
			</CardContent>
			<CardFooter>
				<p>Card Footer</p>
			</CardFooter>
		</Card>
	),
};

export const WithoutFooter: Story = {
	render: () => (
		<Card className="w-[350px]">
			<CardHeader>
				<CardTitle>Card Title</CardTitle>
				<CardDescription>This card has no footer</CardDescription>
			</CardHeader>
			<CardContent>
				<p>Card Content</p>
			</CardContent>
		</Card>
	),
};

export const ContentOnly: Story = {
	render: () => (
		<Card className="w-[350px]">
			<CardContent>
				<p>This card only has content without header or footer.</p>
			</CardContent>
		</Card>
	),
};

export const CustomStyling: Story = {
	render: () => (
		<Card className="w-[350px] bg-primary text-primary-foreground">
			<CardHeader className="border-primary-foreground/10 border-b">
				<CardTitle className="text-3xl">Custom Card</CardTitle>
				<CardDescription className="text-primary-foreground/70">
					With custom styling
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-6">
				<p>This card has custom background and text colors.</p>
			</CardContent>
		</Card>
	),
};

export const ProductCard: Story = {
	render: () => (
		<Card className="w-[300px]">
			<CardHeader>
				<CardTitle>Premium Plan</CardTitle>
				<CardDescription>Perfect for growing businesses</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="font-bold text-3xl">$29.99/mo</p>
				<ul className="mt-4 space-y-2">
					<li>Unlimited projects</li>
					<li>24/7 support</li>
					<li>Advanced analytics</li>
				</ul>
			</CardContent>
			<CardFooter>
				<button
					type="button"
					className="w-full rounded bg-primary px-4 py-2 text-primary-foreground"
				>
					Choose Plan
				</button>
			</CardFooter>
		</Card>
	),
};

export const UserProfileCard: Story = {
	render: () => (
		<Card className="w-[300px]">
			<CardHeader>
				<div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-300" />
				<CardTitle>John Doe</CardTitle>
				<CardDescription>Software Developer</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-center">
					Passionate about creating intuitive user experiences and scalable
					applications.
				</p>
			</CardContent>
			<CardFooter className="justify-center space-x-4">
				<button
					type="button"
					className="rounded bg-primary px-4 py-2 text-primary-foreground"
				>
					Connect
				</button>
				<button
					type="button"
					className="rounded bg-secondary px-4 py-2 text-secondary-foreground"
				>
					Message
				</button>
			</CardFooter>
		</Card>
	),
};

export const NestedCards: Story = {
	render: () => (
		<Card className="w-[400px]">
			<CardHeader>
				<CardTitle>Parent Card</CardTitle>
				<CardDescription>This card contains nested cards</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Nested Card 1</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Content of nested card 1</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Nested Card 2</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Content of nested card 2</p>
					</CardContent>
				</Card>
			</CardContent>
		</Card>
	),
};
