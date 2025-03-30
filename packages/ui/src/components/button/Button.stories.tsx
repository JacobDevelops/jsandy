import { ArrowRight, Plus, Trash } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
	title: "Components/Button",
	component: Button,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"destructive",
				"outline",
				"secondary",
				"ghost",
				"link",
			],
		},
		size: {
			control: "select",
			options: ["default", "sm", "lg", "icon"],
		},
		asChild: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
	args: {
		children: "Button",
	},
};

export const Destructive: Story = {
	args: {
		variant: "destructive",
		children: "Delete",
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: "Outline",
	},
};

export const Secondary: Story = {
	args: {
		variant: "secondary",
		children: "Secondary",
	},
};

export const Ghost: Story = {
	args: {
		variant: "ghost",
		children: "Ghost",
	},
};

export const Link: Story = {
	args: {
		variant: "link",
		children: "Link",
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		children: "Small",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		children: "Large",
	},
};

export const IconButton: Story = {
	args: {
		size: "icon",
		children: <Plus />,
		"aria-label": "Add item",
	},
};

export const WithIcon: Story = {
	args: {
		children: (
			<>
				Next <ArrowRight />
			</>
		),
	},
};

export const Loading: Story = {
	args: {
		children: "Loading...",
		disabled: true,
	},
};

export const AsChild: Story = {
	args: {
		asChild: true,
		children: <a href="https://example.com">Link as button</a>,
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button>Default</Button>
			<Button variant="destructive">Destructive</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="link">Link</Button>
		</div>
	),
};

export const AllSizes: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-4">
			<Button size="sm">Small</Button>
			<Button>Default</Button>
			<Button size="lg">Large</Button>
			<Button size="icon">
				<Plus />
			</Button>
		</div>
	),
};

export const WithDifferentIcons: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button>
				<Plus /> Add
			</Button>
			<Button variant="destructive">
				<Trash /> Delete
			</Button>
			<Button variant="outline">
				Next <ArrowRight />
			</Button>
		</div>
	),
};

export const DisabledStates: Story = {
	render: () => (
		<div className="flex flex-wrap gap-4">
			<Button disabled>Disabled</Button>
			<Button variant="destructive" disabled>
				Disabled Destructive
			</Button>
			<Button variant="outline" disabled>
				Disabled Outline
			</Button>
			<Button variant="ghost" disabled>
				Disabled Ghost
			</Button>
		</div>
	),
};
