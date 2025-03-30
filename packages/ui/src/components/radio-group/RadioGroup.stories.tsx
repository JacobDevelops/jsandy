import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

const meta: Meta<typeof RadioGroup> = {
	title: "Components/RadioGroup",
	component: RadioGroup,
	tags: ["autodocs"],
	argTypes: {
		disabled: { control: "boolean" },
		required: { control: "boolean" },
		orientation: { control: "radio", options: ["horizontal", "vertical"] },
	},
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
	render: (args) => (
		<RadioGroup {...args}>
			<RadioGroupItem value="option1" id="r1">
				Option 1
			</RadioGroupItem>
			<RadioGroupItem value="option2" id="r2">
				Option 2
			</RadioGroupItem>
			<RadioGroupItem value="option3" id="r3">
				Option 3
			</RadioGroupItem>
		</RadioGroup>
	),
};

export const Disabled: Story = {
	render: () => (
		<RadioGroup disabled defaultValue="option1">
			<RadioGroupItem value="option1" id="d1">
				Disabled Option 1
			</RadioGroupItem>
			<RadioGroupItem value="option2" id="d2">
				Disabled Option 2
			</RadioGroupItem>
		</RadioGroup>
	),
};

export const Horizontal: Story = {
	render: () => (
		<RadioGroup orientation="horizontal">
			<RadioGroupItem value="h1" id="h1">
				Horizontal 1
			</RadioGroupItem>
			<RadioGroupItem value="h2" id="h2">
				Horizontal 2
			</RadioGroupItem>
			<RadioGroupItem value="h3" id="h3">
				Horizontal 3
			</RadioGroupItem>
		</RadioGroup>
	),
};

export const Controlled: Story = {
	render: () => {
		const [value, setValue] = React.useState("controlled1");
		return (
			<RadioGroup value={value} onValueChange={setValue}>
				<RadioGroupItem value="controlled1" id="c1">
					Controlled 1
				</RadioGroupItem>
				<RadioGroupItem value="controlled2" id="c2">
					Controlled 2
				</RadioGroupItem>
				<RadioGroupItem value="controlled3" id="c3">
					Controlled 3
				</RadioGroupItem>
			</RadioGroup>
		);
	},
};

export const WithForm: Story = {
	render: () => (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const formData = new FormData(e.currentTarget);
				alert(`Selected option: ${formData.get("radio-group")}`);
			}}
		>
			<RadioGroup name="radio-group">
				<RadioGroupItem value="form1" id="f1">
					Form Option 1
				</RadioGroupItem>
				<RadioGroupItem value="form2" id="f2">
					Form Option 2
				</RadioGroupItem>
			</RadioGroup>
			<button type="submit" style={{ marginTop: "10px" }}>
				Submit
			</button>
		</form>
	),
};
