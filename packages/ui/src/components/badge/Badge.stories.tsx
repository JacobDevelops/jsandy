import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
	title: "Components/Badge",
	component: Badge,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "secondary", "destructive", "outline"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
	args: {
		children: "Badge",
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Secondary",
	},
};

export const Destructive: Story = {
	args: {
		variant: "destructive",
		children: "Destructive",
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: "Outline",
	},
};

export const WithIcon: Story = {
	render: (args) => (
		<Badge {...args}>
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
				className="mr-1 h-3 w-3"
			>
				<title>New feature</title>
				<path d="M12 2v20" />
				<path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
			</svg>
			New feature
		</Badge>
	),
};

export const CustomStyling: Story = {
	args: {
		children: "Custom",
		className: "bg-purple-500 hover:bg-purple-700 text-white",
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<Badge>Default</Badge>
			<Badge variant="secondary">Secondary</Badge>
			<Badge variant="destructive">Destructive</Badge>
			<Badge variant="outline">Outline</Badge>
		</div>
	),
};

export const Sizes: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-2">
			<Badge className="text-xs">Small</Badge>
			<Badge>Default</Badge>
			<Badge className="text-lg">Large</Badge>
		</div>
	),
};

export const WithNumbers: Story = {
	render: () => (
		<div className="flex flex-wrap gap-2">
			<Badge>1</Badge>
			<Badge variant="secondary">10</Badge>
			<Badge variant="destructive">100</Badge>
			<Badge variant="outline">1000+</Badge>
		</div>
	),
};
