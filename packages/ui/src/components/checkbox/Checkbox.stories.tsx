import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
	title: "Components/Checkbox",
	component: Checkbox,
	tags: ["autodocs"],
	argTypes: {
		checked: {
			control: "select",
			options: [true, false, "indeterminate"],
		},
		disabled: {
			control: "boolean",
		},
		required: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
	render: (args) => (
		<div className="flex items-center space-x-2">
			<Checkbox id="terms" {...args} />
			<label
				htmlFor="terms"
				className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				style={{ marginLeft: "0.25rem" }}
			>
				Accept terms and conditions
			</label>
		</div>
	),
};

export const Checked: Story = {
	...Default,
	args: {
		checked: true,
	},
};

export const Unchecked: Story = {
	...Default,
	args: {
		checked: false,
	},
};

export const Indeterminate: Story = {
	...Default,
	args: {
		checked: "indeterminate",
	},
};

export const Disabled: Story = {
	...Default,
	args: {
		disabled: true,
	},
};

export const WithForm: Story = {
	render: () => (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const formData = new FormData(e.currentTarget);
				alert(`Selected toppings: ${formData.getAll("toppings")}`);
			}}
		>
			<fieldset className="space-y-2">
				<legend className="font-semibold text-sm">Choose your toppings:</legend>
				<div
					className="flex items-center"
					style={{ gap: "0.25rem", display: "flex" }}
				>
					<Checkbox id="cheese" name="toppings" value="cheese" />
					<label htmlFor="cheese">Extra cheese</label>
				</div>
				<div
					className="flex items-center"
					style={{ gap: "0.25rem", display: "flex" }}
				>
					<Checkbox id="pepperoni" name="toppings" value="pepperoni" />
					<label htmlFor="pepperoni">Pepperoni</label>
				</div>
				<div
					className="flex items-center"
					style={{ gap: "0.25rem", display: "flex" }}
				>
					<Checkbox id="mushrooms" name="toppings" value="mushrooms" />
					<label htmlFor="mushrooms">Mushrooms</label>
				</div>
			</fieldset>
			<button
				type="submit"
				className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
			>
				Submit
			</button>
		</form>
	),
};

export const ControlledCheckbox: Story = {
	render: () => {
		const [checked, setChecked] = useState(false);
		return (
			<div
				className="flex items-center"
				style={{ gap: "0.25rem", display: "flex" }}
			>
				<Checkbox
					id="controlled"
					checked={checked}
					onCheckedChange={(state) => setChecked(state === true)}
				/>
				<label htmlFor="controlled">{checked ? "Checked" : "Unchecked"}</label>
			</div>
		);
	},
};

export const CustomStyling: Story = {
	render: () => (
		<div
			className="flex items-center"
			style={{ gap: "0.25rem", display: "flex" }}
		>
			<Checkbox
				id="custom"
				className="h-6 w-6 rounded-full border-2 border-purple-500 focus:ring-purple-500"
			/>
			<label htmlFor="custom" className="font-bold text-purple-700">
				Custom styled checkbox
			</label>
		</div>
	),
};
