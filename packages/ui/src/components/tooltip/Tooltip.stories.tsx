import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
	Tooltip,
	TooltipArrow,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
	title: "Components/Tooltip",
	component: Tooltip,
	tags: ["autodocs", "figma"],
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger>Hover me</TooltipTrigger>
			<TooltipContent>This is a tooltip</TooltipContent>
		</Tooltip>
	),
};

export const WithArrow: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger>Hover me</TooltipTrigger>
			<TooltipContent>
				This is a tooltip with an arrow
				<TooltipArrow />
			</TooltipContent>
		</Tooltip>
	),
};

export const CustomPosition: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger>Hover me</TooltipTrigger>
			<TooltipContent side="bottom" align="start" sideOffset={5}>
				Bottom-aligned tooltip
			</TooltipContent>
		</Tooltip>
	),
};

export const CustomStyling: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger className="rounded bg-blue-500 px-4 py-2 text-white">
				Hover me
			</TooltipTrigger>
			<TooltipContent className="rounded bg-green-500 p-2 text-white">
				Custom styled tooltip
			</TooltipContent>
		</Tooltip>
	),
};

export const ControlledTooltip: Story = {
	render: () => {
		const [open, setOpen] = React.useState(false);
		return (
			<Tooltip open={open} onOpenChange={setOpen}>
				<TooltipTrigger onClick={() => setOpen((prev) => !prev)}>
					Click me
				</TooltipTrigger>
				<TooltipContent>This is a controlled tooltip</TooltipContent>
			</Tooltip>
		);
	},
};

export const WithDelay: Story = {
	render: () => (
		<TooltipProvider delayDuration={1000}>
			<Tooltip>
				<TooltipTrigger>Hover me (1s delay)</TooltipTrigger>
				<TooltipContent>This tooltip has a 1-second delay</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
};

export const DisabledHoverableContent: Story = {
	render: () => (
		<TooltipProvider disableHoverableContent>
			<Tooltip>
				<TooltipTrigger>Hover me</TooltipTrigger>
				<TooltipContent>
					This tooltip closes when you move away from the trigger
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	),
};

export const NestedTooltips: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger>Hover for nested tooltips</TooltipTrigger>
			<TooltipContent>
				Outer tooltip
				<Tooltip>
					<TooltipTrigger>Hover me too</TooltipTrigger>
					<TooltipContent>Inner tooltip</TooltipContent>
				</Tooltip>
			</TooltipContent>
		</Tooltip>
	),
};
