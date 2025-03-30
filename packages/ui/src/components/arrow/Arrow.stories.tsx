import type { Meta, StoryObj } from "@storybook/react";
import { Arrow } from "./Arrow";

const meta: Meta<typeof Arrow> = {
	title: "Components/Arrow",
	component: Arrow,
	tags: ["autodocs"],
	argTypes: {
		width: { control: "number" },
		height: { control: "number" },
		fill: { control: "color" },
	},
};

export default meta;
type Story = StoryObj<typeof Arrow>;

export const Default: Story = {
	args: {
		width: 20,
		height: 10,
	},
};

export const CustomColor: Story = {
	args: {
		width: 30,
		height: 15,
		fill: "red",
	},
};

export const LargeArrow: Story = {
	args: {
		width: 50,
		height: 25,
	},
};

export const CustomShape: Story = {
	render: (args) => (
		<Arrow {...args} asChild>
			<path d="M0,0 L30,0 Q15,20 0,0" fill="currentColor" />
		</Arrow>
	),
	args: {
		width: 30,
		height: 20,
	},
};

export const MultipleArrows: Story = {
	render: () => (
		<div className="flex space-x-4">
			<Arrow width={20} height={10} fill="blue" />
			<Arrow width={20} height={10} fill="green" />
			<Arrow width={20} height={10} fill="red" />
		</div>
	),
};

export const ArrowsWithDifferentOrientations: Story = {
	render: () => (
		<div className="space-y-4">
			<Arrow width={20} height={10} />
			<Arrow width={20} height={10} style={{ transform: "rotate(90deg)" }} />
			<Arrow width={20} height={10} style={{ transform: "rotate(180deg)" }} />
			<Arrow width={20} height={10} style={{ transform: "rotate(270deg)" }} />
		</div>
	),
};
