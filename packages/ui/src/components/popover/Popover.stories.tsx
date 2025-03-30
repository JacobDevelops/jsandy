import { X } from "lucide-react";
import { Button } from "@jsandy/ui/button";
import { Input } from "@jsandy/ui/input";
import { Label } from "@jsandy/ui/label";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
	Popover,
	PopoverAnchor,
	PopoverArrow,
	PopoverClose,
	PopoverContent,
	PopoverTrigger,
} from "./Popover";

const meta: Meta<typeof Popover> = {
	title: "Components/Popover",
	component: Popover,
	tags: ["autodocs"],
	argTypes: {
		modal: {
			control: { type: "boolean" },
			description:
				"When true, the popover blocks interactions with elements outside it",
		},
		open: {
			control: { type: "boolean" },
			description: "Controls the open state of the popover",
		},
		defaultOpen: {
			control: { type: "boolean" },
			description: "The initial open state when the popover is first rendered",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Popover>;

/**
 * This is the basic usage of the Popover component with default styling.
 * It includes the main parts: trigger button and content.
 */
export const Basic: Story = {
	render: (args) => (
		<div className="flex items-center justify-center p-8">
			<Popover {...args}>
				<PopoverTrigger asChild>
					<Button variant="outline">Open Popover</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80">
					<div className="grid gap-4">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Basic Popover</h4>
							<p className="text-muted-foreground text-sm">
								This is a basic popover that appears when you click the trigger
								button.
							</p>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	),
};

/**
 * This example shows a popover with an arrow pointing to the trigger element.
 * The arrow helps users understand the relationship between the popover and its trigger.
 */
export const WithArrow: Story = {
	render: (args) => (
		<div className="flex items-center justify-center p-8">
			<Popover {...args}>
				<PopoverTrigger asChild>
					<Button variant="outline">Popover with Arrow</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80">
					<PopoverArrow className="fill-popover" />
					<div className="grid gap-4">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Arrow Indicator</h4>
							<p className="text-muted-foreground text-sm">
								This popover includes an arrow that points to the trigger
								element.
							</p>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	),
};

/**
 * This example demonstrates a popover with form elements inside.
 * Popovers are useful for compact forms and configuration interfaces.
 */
export const WithForm: Story = {
	render: (args) => (
		<div className="flex items-center justify-center p-8">
			<Popover {...args}>
				<PopoverTrigger asChild>
					<Button variant="outline">Edit Settings</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80">
					<div className="grid gap-4">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Dimensions</h4>
							<p className="text-muted-foreground text-sm">
								Set the dimensions for the layer.
							</p>
						</div>
						<div className="grid gap-2">
							<div className="grid grid-cols-3 items-center gap-4">
								<Label htmlFor="width">Width</Label>
								<Input
									id="width"
									defaultValue="100%"
									className="col-span-2 h-8"
								/>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label htmlFor="maxWidth">Max. width</Label>
								<Input
									id="maxWidth"
									defaultValue="300px"
									className="col-span-2 h-8"
								/>
							</div>
							<div className="grid grid-cols-3 items-center gap-4">
								<Label htmlFor="height">Height</Label>
								<Input
									id="height"
									defaultValue="25px"
									className="col-span-2 h-8"
								/>
							</div>
						</div>
						<Button type="submit">Save changes</Button>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	),
};

/**
 * This example shows a popover with an explicit close button in the top-right corner.
 * This pattern is useful when you want to give users a clear way to dismiss the popover.
 */
export const WithCloseButton: Story = {
	render: (args) => (
		<div className="flex items-center justify-center p-8">
			<Popover {...args}>
				<PopoverTrigger asChild>
					<Button variant="outline">With Close Button</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">Popover Title</h4>
						<PopoverClose className="inline-flex h-6 w-6 items-center justify-center rounded-full outline-hidden hover:bg-slate-100 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2">
							<X className="h-4 w-4" />
							<span className="sr-only">Close</span>
						</PopoverClose>
					</div>
					<div className="mt-4 grid gap-4">
						<p className="text-muted-foreground text-sm">
							This popover includes an explicit close button in the top-right
							corner. Click it or press Escape to close the popover.
						</p>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	),
};

/**
 * This example demonstrates a controlled popover where the open state is managed by React state.
 * This allows for programmatic control of the popover's visibility.
 */
export const Controlled: Story = {
	render: (args) => {
		const [open, setOpen] = useState(false);

		return (
			<div className="flex items-center justify-center p-8">
				<div className="grid gap-8">
					<div className="flex gap-4">
						<Button
							variant="secondary"
							onClick={() => setOpen(true)}
							disabled={open}
						>
							Open Popover
						</Button>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={!open}
						>
							Close Popover
						</Button>
					</div>

					<Popover {...args} open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button variant={open ? "default" : "outline"}>
								{open ? "Popover Open" : "Popover Closed"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="grid gap-4">
								<div className="space-y-2">
									<h4 className="font-medium leading-none">
										Controlled Popover
									</h4>
									<p className="text-muted-foreground text-sm">
										This popover&apos;s open state is controlled using React
										state. You can open or close it using the buttons above.
									</p>
								</div>
								<Button onClick={() => setOpen(false)}>Close</Button>
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>
		);
	},
};

/**
 * This example shows a modal popover that blocks interaction with the content behind it.
 * Use modal popovers when you need to focus the user's attention on the popover content.
 */
export const Modal: Story = {
	args: {
		modal: true,
	},
	render: (args) => (
		<div className="flex items-center justify-center p-8">
			<Popover {...args}>
				<PopoverTrigger asChild>
					<Button variant="outline">Modal Popover</Button>
				</PopoverTrigger>
				<PopoverContent className="w-80">
					<PopoverArrow className="fill-popover" />
					<div className="grid gap-4">
						<div className="space-y-2">
							<h4 className="font-medium leading-none">Modal Popover</h4>
							<p className="text-muted-foreground text-sm">
								This is a modal popover that blocks interaction with content
								behind it. You must explicitly close the popover to interact
								with the rest of the UI.
							</p>
						</div>
						<PopoverClose asChild>
							<Button size="sm">Close</Button>
						</PopoverClose>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	),
};

/**
 * This example demonstrates using a custom anchor element for the popover.
 * The popover can be anchored to any element, not just the trigger.
 */
export const CustomAnchor: Story = {
	render: (args) => (
		<div className="flex items-center justify-center p-8">
			<div className="relative grid items-start gap-8">
				<Popover {...args}>
					<div className="flex items-center gap-4">
						<PopoverAnchor asChild>
							<div className="h-12 w-12 rounded-md bg-primary" />
						</PopoverAnchor>
						<PopoverTrigger asChild>
							<Button variant="outline">Custom Anchor</Button>
						</PopoverTrigger>
						<PopoverContent side="left" align="start" className="w-80">
							<PopoverArrow className="fill-popover" />
							<div className="grid gap-4">
								<div className="space-y-2">
									<h4 className="font-medium leading-none">Custom Anchor</h4>
									<p className="text-muted-foreground text-sm">
										This popover is anchored to the colored square instead of
										the trigger button. This demonstrates how you can position
										popovers relative to any element.
									</p>
								</div>
							</div>
						</PopoverContent>
					</div>
				</Popover>
			</div>
		</div>
	),
};

/**
 * This example shows different popover positioning options.
 * Popovers can be positioned at different sides and alignments relative to the trigger.
 */
export const Positioning: Story = {
	render: (args) => (
		<div className="flex items-center justify-center p-16">
			<div className="grid grid-cols-3 gap-16">
				<Popover {...args}>
					<PopoverTrigger asChild>
						<Button variant="outline">Top</Button>
					</PopoverTrigger>
					<PopoverContent side="top" className="w-60">
						<PopoverArrow className="fill-popover" />
						<p className="text-sm">This popover appears above the trigger</p>
					</PopoverContent>
				</Popover>

				<Popover {...args}>
					<PopoverTrigger asChild>
						<Button variant="outline">Right</Button>
					</PopoverTrigger>
					<PopoverContent side="right" className="w-60">
						<PopoverArrow className="fill-popover" />
						<p className="text-sm">
							This popover appears to the right of the trigger
						</p>
					</PopoverContent>
				</Popover>

				<Popover {...args}>
					<PopoverTrigger asChild>
						<Button variant="outline">Bottom</Button>
					</PopoverTrigger>
					<PopoverContent side="bottom" className="w-60">
						<PopoverArrow className="fill-popover" />
						<p className="text-sm">This popover appears below the trigger</p>
					</PopoverContent>
				</Popover>

				<Popover {...args}>
					<PopoverTrigger asChild>
						<Button variant="outline">Left</Button>
					</PopoverTrigger>
					<PopoverContent side="left" className="w-60">
						<PopoverArrow className="fill-popover" />
						<p className="text-sm">
							This popover appears to the left of the trigger
						</p>
					</PopoverContent>
				</Popover>

				<Popover {...args}>
					<PopoverTrigger asChild>
						<Button variant="outline">Start Aligned</Button>
					</PopoverTrigger>
					<PopoverContent align="start" className="w-60">
						<PopoverArrow className="fill-popover" />
						<p className="text-sm">
							This popover is aligned to the start of the trigger
						</p>
					</PopoverContent>
				</Popover>

				<Popover {...args}>
					<PopoverTrigger asChild>
						<Button variant="outline">End Aligned</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-60">
						<PopoverArrow className="fill-popover" />
						<p className="text-sm">
							This popover is aligned to the end of the trigger
						</p>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	),
};
