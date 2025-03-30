import type { Meta, StoryObj } from "@storybook/react";
import { Spinner } from "./Spinner";

const meta: Meta<typeof Spinner> = {
	title: "Components/Spinner",
	component: Spinner,
	tags: ["autodocs"],
	argTypes: {
		size: {
			control: "select",
			options: ["sm", "md", "lg"],
		},
		color: {
			control: "select",
			options: ["primary", "secondary", "accent"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
	args: {
		size: "md",
		color: "primary",
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		color: "primary",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		color: "primary",
	},
};

export const Secondary: Story = {
	args: {
		size: "md",
		color: "secondary",
	},
};

export const Accent: Story = {
	args: {
		size: "md",
		color: "accent",
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Spinner size="sm" color="primary" />
			<Spinner size="md" color="primary" />
			<Spinner size="lg" color="primary" />
			<Spinner size="md" color="secondary" />
			<Spinner size="md" color="accent" />
		</div>
	),
};
