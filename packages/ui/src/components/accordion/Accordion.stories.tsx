import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@jsandy/ui/accordion";
import { cn } from "@jsandy/ui/cn";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

const meta: Meta<typeof Accordion> = {
	title: "Components/Accordion",
	component: Accordion,
	tags: ["autodocs"],
	argTypes: {
		type: {
			control: "radio",
			options: ["single", "multiple"],
			description: "Determines whether one or multiple items can be opened",
			table: {
				type: { summary: "single | multiple" },
				defaultValue: { summary: "single" },
			},
		},
		collapsible: {
			control: "boolean",
			description: 'When type is "single", allows the open item to be closed',
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		disabled: {
			control: "boolean",
			description:
				"When true, prevents user interaction with the entire accordion",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
		dir: {
			control: "radio",
			options: ["ltr", "rtl"],
			description: "Text and navigation direction",
			table: {
				type: { summary: "ltr | rtl" },
				defaultValue: { summary: "ltr" },
			},
		},
		className: {
			control: "text",
			description: "Additional CSS class names",
		},
	},
	parameters: {
		componentSubtitle:
			"A vertically stacked set of interactive headings that reveal or hide content",
		docs: {
			description: {
				component: `
Accordion components display a list of high-level options that can expand/collapse to reveal more information.
They're commonly used to reduce information overload and progressively disclose details.
        `,
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof Accordion>;

/**
 * Basic single-item accordion with the collapsible option enabled.
 * Only one item can be expanded at a time, and the expanded item can be collapsed.
 */
export const Basic: Story = {
	args: {
		type: "single",
		collapsible: true,
	},
	render: (args) => (
		<Accordion {...args}>
			<AccordionItem value="item-1">
				<AccordionTrigger>Is it accessible?</AccordionTrigger>
				<AccordionContent>
					Yes. The Accordion component adheres to the WAI-ARIA design pattern
					and includes keyboard interactions, proper ARIA roles, and focus
					management.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-2">
				<AccordionTrigger>Is styling customizable?</AccordionTrigger>
				<AccordionContent>
					Yes. The component accepts custom className props and all styling can
					be overridden using your own CSS or utility classes.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-3">
				<AccordionTrigger>Can it be controlled?</AccordionTrigger>
				<AccordionContent>
					Yes. The component supports both controlled and uncontrolled modes
					through the value/defaultValue props.
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
};

/**
 * Multiple accordion with several items that can be expanded simultaneously.
 * In this mode, opening one item does not close others.
 */
export const Multiple: Story = {
	args: {
		type: "multiple",
		defaultValue: ["item-1"],
	},
	render: (args) => (
		<Accordion {...args}>
			<AccordionItem value="item-1">
				<AccordionTrigger>First section</AccordionTrigger>
				<AccordionContent>
					This content can be open at the same time as other sections. Multiple
					accordions allow users to compare information across different
					sections.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-2">
				<AccordionTrigger>Second section</AccordionTrigger>
				<AccordionContent>
					You can expand this without closing the first section. This pattern is
					useful when items contain independent information.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-3">
				<AccordionTrigger>Third section</AccordionTrigger>
				<AccordionContent>
					All sections can be opened simultaneously. Use this mode when users
					might need to see multiple items at once.
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
};

/**
 * Single accordion that cannot be collapsed - once an item is opened,
 * it can only be closed by opening another item.
 */
export const NonCollapsible: Story = {
	args: {
		type: "single",
		collapsible: false,
		defaultValue: "item-1",
	},
	render: (args) => (
		<Accordion {...args}>
			<AccordionItem value="item-1">
				<AccordionTrigger>Always one section open</AccordionTrigger>
				<AccordionContent>
					This accordion always keeps one section open. You can switch between
					sections, but you cannot collapse all sections.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-2">
				<AccordionTrigger>Click to switch sections</AccordionTrigger>
				<AccordionContent>
					Clicking this will close the previous section and open this one. This
					ensures that users always have access to some content.
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-3">
				<AccordionTrigger>Cannot collapse all</AccordionTrigger>
				<AccordionContent>
					This pattern is useful for wizards, setup guides, or when content
					should always be visible to the user.
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
};

/**
 * Controlled accordion where state is managed externally.
 * Includes control buttons to demonstrate external state management.
 */
export const Controlled: Story = {
	render: () => {
		const [value, setValue] = useState("item-1");

		return (
			<div className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => setValue("item-1")}
						className={cn(
							"rounded-md px-4 py-2 font-medium text-sm transition-colors",
							value === "item-1"
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
						)}
					>
						Open First
					</button>
					<button
						type="button"
						onClick={() => setValue("item-2")}
						className={cn(
							"rounded-md px-4 py-2 font-medium text-sm transition-colors",
							value === "item-2"
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
						)}
					>
						Open Second
					</button>
					<button
						type="button"
						onClick={() => setValue("item-3")}
						className={cn(
							"rounded-md px-4 py-2 font-medium text-sm transition-colors",
							value === "item-3"
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
						)}
					>
						Open Third
					</button>
					<button
						type="button"
						onClick={() => setValue("")}
						className="rounded-md bg-destructive px-4 py-2 font-medium text-destructive-foreground text-sm transition-colors hover:bg-destructive/90"
					>
						Close All
					</button>
				</div>

				<Accordion
					type="single"
					collapsible
					value={value}
					onValueChange={setValue}
				>
					<AccordionItem value="item-1">
						<AccordionTrigger>Section One</AccordionTrigger>
						<AccordionContent>
							This accordion&apos;s state is controlled externally through the
							value and onValueChange props. The buttons above demonstrate how
							to control which section is open.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-2">
						<AccordionTrigger>Section Two</AccordionTrigger>
						<AccordionContent>
							Controlled accordions are useful when you need to manage state in
							response to other UI elements or application logic.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-3">
						<AccordionTrigger>Section Three</AccordionTrigger>
						<AccordionContent>
							For example, you might want to open specific accordion sections
							based on user actions elsewhere in your application.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		);
	},
};

/**
 * Demonstrates disabled state - both for individual items and the entire accordion.
 */
export const Disabled: Story = {
	args: {
		type: "single",
		collapsible: true,
	},
	render: (args) => (
		<div className="space-y-6">
			<div>
				<h3 className="mb-2 font-medium text-sm">Item-level disabled:</h3>
				<Accordion {...args} className="rounded-md border">
					<AccordionItem value="item-1">
						<AccordionTrigger>Enabled section</AccordionTrigger>
						<AccordionContent>
							This section works normally and can be interacted with.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-2" disabled>
						<AccordionTrigger>Disabled section</AccordionTrigger>
						<AccordionContent>
							This content won&apos;t be accessible because the item is
							disabled. Notice the visual styling indicating it&apos;s disabled.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-3">
						<AccordionTrigger>Another enabled section</AccordionTrigger>
						<AccordionContent>
							This section works normally while only the middle section is
							disabled.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>

			<div>
				<h3 className="mb-2 font-medium text-sm">
					Entirely disabled accordion:
				</h3>
				<Accordion {...args} disabled className="rounded-md border">
					<AccordionItem value="item-1">
						<AccordionTrigger>Completely disabled</AccordionTrigger>
						<AccordionContent>
							The entire accordion is disabled. None of the items can be
							expanded.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-2">
						<AccordionTrigger>Also disabled</AccordionTrigger>
						<AccordionContent>
							All triggers are non-interactive when the root accordion is
							disabled.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	),
};

/**
 * Nested accordions demonstration for creating hierarchical content structures.
 */
export const Nested: Story = {
	args: {
		type: "single",
		collapsible: true,
	},
	render: (args) => (
		<Accordion {...args}>
			<AccordionItem value="item-1">
				<AccordionTrigger>Main Category 1</AccordionTrigger>
				<AccordionContent>
					<p className="mb-4">Main category content goes here.</p>
					<Accordion type="single" collapsible className="rounded-md border">
						<AccordionItem value="nested-1">
							<AccordionTrigger className="text-sm">
								Subcategory 1.1
							</AccordionTrigger>
							<AccordionContent className="text-sm">
								<p>Content for subcategory 1.1</p>
								<p className="mt-2">
									Nested accordions are useful for creating hierarchical
									navigation.
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="nested-2">
							<AccordionTrigger className="text-sm">
								Subcategory 1.2
							</AccordionTrigger>
							<AccordionContent className="text-sm">
								<p>Content for subcategory 1.2</p>
								<p className="mt-2">
									Each level can be independently controlled.
								</p>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-2">
				<AccordionTrigger>Main Category 2</AccordionTrigger>
				<AccordionContent>
					<p className="mb-4">Main category content goes here.</p>
					<Accordion type="multiple" className="rounded-md border">
						<AccordionItem value="nested-3">
							<AccordionTrigger className="text-sm">
								Subcategory 2.1
							</AccordionTrigger>
							<AccordionContent className="text-sm">
								<p>Content for subcategory 2.1</p>
								<p className="mt-2">
									This nested accordion uses type=&quot;multiple&quot;.
								</p>
							</AccordionContent>
						</AccordionItem>
						<AccordionItem value="nested-4">
							<AccordionTrigger className="text-sm">
								Subcategory 2.2
							</AccordionTrigger>
							<AccordionContent className="text-sm">
								<p>Content for subcategory 2.2</p>
								<p className="mt-2">
									Multiple subcategories can be opened at once here.
								</p>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
};

/**
 * Rich content demonstration showing various types of content within an accordion.
 */
export const RichContent: Story = {
	args: {
		type: "single",
		collapsible: true,
	},
	render: (args) => (
		<Accordion {...args}>
			<AccordionItem value="item-1">
				<AccordionTrigger>Text Content</AccordionTrigger>
				<AccordionContent>
					<h4 className="mb-2 font-medium text-lg">Article Title</h4>
					<p>
						This is a paragraph of text. Accordions can contain rich text
						content including headings, paragraphs, and other elements.
					</p>
					<p className="mt-2">
						Multiple paragraphs work well within accordions, allowing for proper
						organization of information.
					</p>
					<ul className="mt-2 list-disc pl-5">
						<li>List items can be included</li>
						<li>Providing structured information</li>
						<li>In an easy-to-read format</li>
					</ul>
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-2">
				<AccordionTrigger>Interactive Elements</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-4">
						<p>Accordions can contain interactive elements:</p>

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="terms"
								className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
							/>
							<label htmlFor="terms" className="text-sm">
								I agree to the terms and conditions
							</label>
						</div>

						<div className="flex space-x-2">
							<input
								type="radio"
								id="option1"
								name="options"
								className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
								defaultChecked
							/>
							<label htmlFor="option1" className="text-sm">
								Option 1
							</label>

							<input
								type="radio"
								id="option2"
								name="options"
								className="ml-4 h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
							/>
							<label htmlFor="option2" className="text-sm">
								Option 2
							</label>
						</div>

						<div>
							<label htmlFor="name" className="block font-medium text-sm">
								Name
							</label>
							<input
								type="text"
								id="name"
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								placeholder="Your name"
							/>
						</div>

						<button
							type="button"
							className="rounded-md bg-indigo-600 px-3 py-2 font-semibold text-sm text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 focus-visible:outline-offset-2"
						>
							Submit
						</button>
					</div>
				</AccordionContent>
			</AccordionItem>
			<AccordionItem value="item-3">
				<AccordionTrigger>Media Content</AccordionTrigger>
				<AccordionContent>
					<div className="space-y-4">
						<p>Accordions can contain various media:</p>

						<div className="flex aspect-video items-center justify-center rounded-md bg-gray-200">
							<span className="text-gray-500">[Video Player]</span>
						</div>

						<div className="flex aspect-square items-center justify-center rounded-md bg-gray-200">
							<span className="text-gray-500">[Image]</span>
						</div>

						<div className="flex h-16 items-center justify-center rounded-md bg-gray-200">
							<span className="text-gray-500">[Audio Player]</span>
						</div>

						<p className="text-gray-600 text-sm">
							Including media in accordions helps conserve space while still
							making rich content available when needed.
						</p>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	),
};

/**
 * Dynamic accordion demonstrating how to programmatically generate accordion items.
 */
export const Dynamic: Story = {
	args: {
		type: "single",
		collapsible: true,
	},
	render: (args) => {
		const items = [
			{
				id: "item-1",
				title: "Dynamic Item 1",
				content:
					"This is the content for dynamic item 1. These items are generated from an array.",
			},
			{
				id: "item-2",
				title: "Dynamic Item 2",
				content:
					"Content for dynamic item 2. This demonstrates how to generate accordion items programmatically.",
			},
			{
				id: "item-3",
				title: "Dynamic Item 3",
				content:
					"Content for dynamic item 3. Dynamic generation is useful when working with data from an API or database.",
			},
			{
				id: "item-4",
				title: "Dynamic Item 4",
				content:
					"Content for dynamic item 4. You can add as many items as needed based on your data source.",
			},
		];

		return (
			<Accordion {...args}>
				{items.map((item) => (
					<AccordionItem key={item.id} value={item.id}>
						<AccordionTrigger>{item.title}</AccordionTrigger>
						<AccordionContent>{item.content}</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		);
	},
};
