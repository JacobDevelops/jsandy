import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "./Select";

const meta: Meta<typeof Select> = {
	title: "Components/Select",
	component: Select,
	tags: ["autodocs", "frequent"],
	argTypes: {
		disabled: { control: "boolean" },
		required: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select an option" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="option1">Option 1</SelectItem>
				<SelectItem value="option2">Option 2</SelectItem>
				<SelectItem value="option3">Option 3</SelectItem>
			</SelectContent>
		</Select>
	),
};

export const Grouped: Story = {
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select a fruit" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Citrus</SelectLabel>
					<SelectItem value="orange">Orange</SelectItem>
					<SelectItem value="lemon">Lemon</SelectItem>
				</SelectGroup>
				<SelectSeparator />
				<SelectGroup>
					<SelectLabel>Berries</SelectLabel>
					<SelectItem value="strawberry">Strawberry</SelectItem>
					<SelectItem value="blueberry">Blueberry</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
};

export const WithDisabledOptions: Story = {
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select an option" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="option1">Option 1</SelectItem>
				<SelectItem value="option2" disabled>
					Option 2 (Disabled)
				</SelectItem>
				<SelectItem value="option3">Option 3</SelectItem>
			</SelectContent>
		</Select>
	),
};

export const Controlled: Story = {
	render: () => {
		const [value, setValue] = React.useState("");
		return (
			<Select value={value} onValueChange={setValue}>
				<SelectTrigger>
					<SelectValue placeholder="Select an option" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="option1">Option 1</SelectItem>
					<SelectItem value="option2">Option 2</SelectItem>
					<SelectItem value="option3">Option 3</SelectItem>
				</SelectContent>
			</Select>
		);
	},
};

export const WithManyOptions: Story = {
	render: (args) => (
		<Select {...args}>
			<SelectTrigger>
				<SelectValue placeholder="Select a country" />
			</SelectTrigger>
			<SelectContent>
				{Array.from({ length: 50 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: This is a static list of items
					<SelectItem key={i} value={`country${i + 1}`}>
						Country {i + 1}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	),
};
