import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
	title: "Components/Switch",
	component: Switch,
	tags: ["autodocs", "frequent", "narrow"],
	argTypes: {
		checked: { control: "boolean" },
		disabled: { control: "boolean" },
		required: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
	render: (args) => <Switch {...args} />,
};

export const Checked: Story = {
	render: (args) => <Switch defaultChecked {...args} />,
};

export const Disabled: Story = {
	render: (args) => <Switch disabled {...args} />,
};

export const WithLabel: Story = {
	render: (args) => (
		<div className="flex items-center space-x-2">
			<Switch id="airplane-mode" {...args} />
			<label
				htmlFor="airplane-mode"
				className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
			>
				Airplane Mode
			</label>
		</div>
	),
};

export const Controlled: Story = {
	render: () => {
		const [checked, setChecked] = React.useState(false);
		return (
			<div className="flex flex-col space-y-2">
				<Switch
					checked={checked}
					onCheckedChange={setChecked}
					aria-label="Controlled switch"
				/>
				<p>The switch is {checked ? "on" : "off"}</p>
			</div>
		);
	},
};

export const InForm: Story = {
	render: () => (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const formData = new FormData(e.currentTarget);
				alert(`Form submitted with value: ${formData.get("switch-value")}`);
			}}
		>
			<div className="flex flex-col space-y-4">
				<div className="flex items-center space-x-2">
					<Switch id="terms" name="switch-value" value="accepted" />
					<label htmlFor="terms" className="font-medium text-sm leading-none">
						Accept terms and conditions
					</label>
				</div>
				<button
					type="submit"
					className="rounded bg-blue-500 px-4 py-2 text-white"
				>
					Submit
				</button>
			</div>
		</form>
	),
};

export const CustomColors: Story = {
	render: (args) => (
		<Switch
			{...args}
			className="bg-orange-300 data-[state=checked]:bg-orange-500"
		/>
	),
};

export const WithDescription: Story = {
	render: (args) => (
		<div className="flex space-x-2">
			<Switch id="marketing" {...args} />
			<div className="grid gap-1.5 leading-none">
				<label
					htmlFor="marketing"
					className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					Marketing emails
				</label>
				<p className="text-muted-foreground text-sm">
					Receive emails about new products, features, and more.
				</p>
			</div>
		</div>
	),
};
