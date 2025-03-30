import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Slot, Slottable } from "./Slot";

const meta: Meta<typeof Slot> = {
	title: "Components/Slot",
	component: Slot,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Slot>;

const Button = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
	<Slot {...props} ref={ref}>
		<button type="button">{children}</button>
	</Slot>
));

Button.displayName = "Button";

export const Default: Story = {
	render: () => (
		<Button className="rounded bg-blue-500 px-4 py-2 text-white">
			Click me
		</Button>
	),
};

export const WithCustomChild: Story = {
	render: () => (
		<Button className="rounded bg-green-500 px-4 py-2 text-white">
			<span className="font-bold">Custom Child</span>
		</Button>
	),
};

export const MergingEventHandlers: Story = {
	render: () => (
		<Button
			className="rounded bg-purple-500 px-4 py-2 text-white"
			onClick={() => console.log("Slot onClick")}
		>
			<button type="button" onClick={() => console.log("Child onClick")}>
				Click for merged handlers
			</button>
		</Button>
	),
};

const ComplexButton = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: React.ReactNode }
>(({ children, icon, ...props }, ref) => (
	<Slot {...props} ref={ref}>
		<button type="button" className="flex items-center space-x-2">
			{icon}
			<Slottable>{children}</Slottable>
		</button>
	</Slot>
));

ComplexButton.displayName = "ComplexButton";

export const WithSlottable: Story = {
	render: () => (
		<ComplexButton
			icon={<span className="text-yellow-500">★</span>}
			className="rounded bg-red-500 px-4 py-2 text-white"
		>
			<span className="font-bold">Slottable Content</span>
		</ComplexButton>
	),
};

export const NestedSlots: Story = {
	render: () => (
		<Slot className="rounded bg-gray-100 p-4">
			<div>
				<h2 className="mb-2 font-bold text-xl">Nested Slots</h2>
				<Slot className="rounded bg-blue-100 p-2">
					<p>This is a nested slot.</p>
				</Slot>
			</div>
		</Slot>
	),
};

const List = React.forwardRef<
	HTMLUListElement,
	React.HTMLAttributes<HTMLUListElement>
>(({ children, ...props }, ref) => (
	<Slot {...props} ref={ref}>
		<ul className="list-disc pl-5">{children}</ul>
	</Slot>
));

List.displayName = "List";

export const ComposingComponents: Story = {
	render: () => (
		<List className="rounded bg-gray-100 p-4">
			<li>Item 1</li>
			<li>Item 2</li>
			<Slot>
				<li className="font-bold">Slotted Item</li>
			</Slot>
		</List>
	),
};
