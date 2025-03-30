import { Button } from "@jsandy/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { DismissableLayer, DismissableLayerBranch } from "./DismissableLayer";

const meta: Meta<typeof DismissableLayer> = {
	title: "Lib/dismissable-layer",
	component: DismissableLayer,
	tags: ["autodocs"],
	argTypes: {
		disableOutsidePointerEvents: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof DismissableLayer>;

export const Default: Story = {
	render: (args) => {
		const [isOpen, setIsOpen] = React.useState(false);
		return (
			<div className="relative h-[300px] w-full bg-gray-100 p-4">
				<Button onClick={() => setIsOpen(true)}>Open Layer</Button>
				{isOpen && (
					<DismissableLayer
						{...args}
						onDismiss={() => setIsOpen(false)}
						className="absolute top-20 left-20 bg-white p-4 shadow-lg"
					>
						<h2 className="mb-2 font-bold text-lg">Dismissable Layer</h2>
						<p>Click outside or press Escape to dismiss.</p>
					</DismissableLayer>
				)}
			</div>
		);
	},
};

export const WithDisabledOutsidePointerEvents: Story = {
	...Default,
	args: {
		disableOutsidePointerEvents: true,
	},
};

export const WithCustomEvents: Story = {
	render: (args) => {
		const [isOpen, setIsOpen] = React.useState(false);
		const [lastEvent, setLastEvent] = React.useState<string | null>(null);

		return (
			<div className="relative h-[300px] w-full bg-gray-100 p-4">
				<Button onClick={() => setIsOpen(true)}>Open Layer</Button>
				{isOpen && (
					<DismissableLayer
						{...args}
						onDismiss={() => setIsOpen(false)}
						onEscapeKeyDown={() => setLastEvent("Escape key pressed")}
						onPointerDownOutside={() => setLastEvent("Pointer down outside")}
						onFocusOutside={() => setLastEvent("Focus moved outside")}
						className="absolute top-20 left-20 bg-white p-4 shadow-lg"
					>
						<h2 className="mb-2 font-bold text-lg">
							Dismissable Layer with Custom Events
						</h2>
						<p>Interact with the layer to see custom event handling.</p>
						{lastEvent && (
							<p className="mt-2 text-gray-600 text-sm">
								Last event: {lastEvent}
							</p>
						)}
					</DismissableLayer>
				)}
			</div>
		);
	},
};

export const WithBranch: Story = {
	render: (args) => {
		const [isOpen, setIsOpen] = React.useState(false);
		return (
			<div className="relative h-[300px] w-full bg-gray-100 p-4">
				<Button onClick={() => setIsOpen(true)}>Open Layer</Button>
				{isOpen && (
					<DismissableLayer
						{...args}
						onDismiss={() => setIsOpen(false)}
						className="absolute top-20 left-20 bg-white p-4 shadow-lg"
					>
						<h2 className="mb-2 font-bold text-lg">
							Dismissable Layer with Branch
						</h2>
						<p>
							Click the button below to open a branch that won&apos;t dismiss
							the layer.
						</p>
						<DismissableLayerBranch className="mt-4">
							<Button onClick={() => alert("Branch clicked")}>
								Click me (won&apos;t dismiss)
							</Button>
						</DismissableLayerBranch>
					</DismissableLayer>
				)}
			</div>
		);
	},
};

export const NestedLayers: Story = {
	render: (args) => {
		const [outerOpen, setOuterOpen] = React.useState(false);
		const [innerOpen, setInnerOpen] = React.useState(false);
		return (
			<div className="relative h-[400px] w-full bg-gray-100 p-4">
				<Button onClick={() => setOuterOpen(true)}>Open Outer Layer</Button>
				{outerOpen && (
					<DismissableLayer
						{...args}
						onDismiss={() => setOuterOpen(false)}
						className="absolute top-20 left-20 bg-white p-4 shadow-lg"
					>
						<h2 className="mb-2 font-bold text-lg">Outer Layer</h2>
						<p>
							This is the outer layer. Click the button to open an inner layer.
						</p>
						<Button onClick={() => setInnerOpen(true)} className="mt-4">
							Open Inner Layer
						</Button>
						{innerOpen && (
							<DismissableLayer
								onDismiss={() => setInnerOpen(false)}
								className="absolute top-10 left-10 bg-gray-200 p-4 shadow-lg"
							>
								<h2 className="mb-2 font-bold text-lg">Inner Layer</h2>
								<p>This is the inner layer. Click outside to dismiss.</p>
							</DismissableLayer>
						)}
					</DismissableLayer>
				)}
			</div>
		);
	},
};
