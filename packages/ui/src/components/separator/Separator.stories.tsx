import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./Separator";

const meta: Meta<typeof Separator> = {
	title: "Components/Separator",
	component: Separator,
	tags: ["autodocs", "frequent", "no-ts"],
	argTypes: {
		orientation: {
			control: "radio",
			options: ["horizontal", "vertical"],
		},
		decorative: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
	render: (args) => (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Section 1</h2>
			<p>This is the content for section 1.</p>
			<Separator {...args} />
			<h2 className="font-semibold text-lg">Section 2</h2>
			<p>This is the content for section 2.</p>
		</div>
	),
};

export const Vertical: Story = {
	render: (args) => (
		<div className="flex h-20 items-center space-x-4">
			<div>Left</div>
			<Separator orientation="vertical" className="h-full" {...args} />
			<div>Right</div>
		</div>
	),
};

export const NonDecorative: Story = {
	render: (args) => (
		<div className="space-y-4">
			<h2 className="font-semibold text-lg">Non-decorative Separator</h2>
			<p>
				This separator is not decorative and will be included in the
				accessibility tree.
			</p>
			<Separator decorative={false} {...args} />
			<p>Content after the non-decorative separator.</p>
		</div>
	),
};

export const InList: Story = {
	render: (args) => (
		<ul className="space-y-2">
			<li>Item 1</li>
			<Separator {...args} />
			<li>Item 2</li>
			<Separator {...args} />
			<li>Item 3</li>
		</ul>
	),
};

export const MultipleOrientations: Story = {
	render: (args) => (
		<div className="flex space-x-4">
			<div className="space-y-2">
				<p>Column 1</p>
				<Separator {...args} />
				<p>Content</p>
			</div>
			<Separator orientation="vertical" className="h-20" {...args} />
			<div className="space-y-2">
				<p>Column 2</p>
				<Separator {...args} />
				<p>Content</p>
			</div>
		</div>
	),
};
