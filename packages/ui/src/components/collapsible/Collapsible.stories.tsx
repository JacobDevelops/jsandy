import { Button } from "@jsandy/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./Collapsible";

const meta: Meta<typeof Collapsible> = {
	title: "Components/Collapsible",
	component: Collapsible,
	tags: ["autodocs"],
	argTypes: {
		open: { control: "boolean" },
		defaultOpen: { control: "boolean" },
		disabled: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
	render: (args) => (
		<Collapsible {...args}>
			<CollapsibleTrigger asChild>
				<Button variant="outline">Toggle</Button>
			</CollapsibleTrigger>
			<div className="mt-2">
				<CollapsibleContent className="rounded-md bg-muted p-4">
					<p>
						This is the collapsible content. It can be expanded or collapsed.
					</p>
				</CollapsibleContent>
			</div>
		</Collapsible>
	),
};

export const OpenByDefault: Story = {
	...Default,
	args: {
		defaultOpen: true,
	},
};

export const Disabled: Story = {
	...Default,
	args: {
		disabled: true,
	},
};

export const WithCustomTrigger: Story = {
	render: (args) => (
		<Collapsible {...args}>
			<CollapsibleTrigger asChild>
				<Button variant="outline" className="w-full justify-between">
					Click to expand
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="h-4 w-4 transition-transform duration-200"
					>
						<title>Expand</title>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-2 rounded-md bg-muted p-4">
				<p>This content can be expanded or collapsed.</p>
				<p className="mt-2">It uses a custom trigger with an icon.</p>
			</CollapsibleContent>
		</Collapsible>
	),
};

export const NestedCollapsibles: Story = {
	render: (args) => (
		<Collapsible {...args}>
			<CollapsibleTrigger asChild>
				<Button variant="outline">Main Section</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className="mt-2 rounded-md bg-muted p-4">
				<p>This is the main collapsible content.</p>
				<Collapsible className="mt-4">
					<CollapsibleTrigger asChild>
						<Button variant="outline" size="sm">
							Subsection
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="mt-2 rounded-md bg-background p-4">
						<p>This is nested collapsible content.</p>
					</CollapsibleContent>
				</Collapsible>
			</CollapsibleContent>
		</Collapsible>
	),
};

export const ControlledCollapsible: Story = {
	render: () => {
		const [isOpen, setIsOpen] = React.useState(false);
		return (
			<div>
				<Collapsible open={isOpen} onOpenChange={setIsOpen}>
					<CollapsibleTrigger asChild>
						<Button variant="outline">
							{isOpen ? "Close" : "Open"} Collapsible
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="mt-2 rounded-md bg-muted p-4">
						<p>This is a controlled collapsible component.</p>
					</CollapsibleContent>
				</Collapsible>
				<div className="mt-4">
					<Button onClick={() => setIsOpen((prev) => !prev)}>
						Toggle from outside
					</Button>
				</div>
			</div>
		);
	},
};

export const MultipleCollapsibles: Story = {
	render: () => (
		<div className="space-y-2">
			{["Section 1", "Section 2", "Section 3"].map((section) => (
				<Collapsible key={section}>
					<CollapsibleTrigger asChild>
						<Button variant="outline" className="w-full justify-between">
							{section}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="h-4 w-4 transition-transform duration-200"
							>
								<title>Expand</title>
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="mt-2 rounded-md bg-muted p-4">
						<p>This is the content for {section.toLowerCase()}.</p>
					</CollapsibleContent>
				</Collapsible>
			))}
		</div>
	),
};
