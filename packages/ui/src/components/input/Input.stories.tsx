import type { Meta, StoryObj } from "@storybook/react";
import { Input, type InputProps } from "./Input";

const meta: Meta<typeof Input> = {
	title: "Components/Input",
	component: Input,
	tags: ["autodocs"],
	argTypes: {
		type: {
			control: {
				type: "select",
				options: ["text", "password", "email", "number", "file"],
			},
			description: "The type of the input field",
		},
		placeholder: {
			control: "text",
			description: "Placeholder text for the input",
		},
		disabled: {
			control: "boolean",
			description: "Whether the input is disabled",
		},
		required: {
			control: "boolean",
			description: "Whether the input is required",
		},
	},
};

export default meta;

export const Default: StoryObj<InputProps> = {
	args: {
		type: "text",
		placeholder: "Enter some text",
	},
};

export const Email: StoryObj<InputProps> = {
	args: {
		type: "email",
		placeholder: "Enter your email",
	},
};

export const Password: StoryObj<InputProps> = {
	args: {
		type: "password",
		placeholder: "Enter your password",
	},
};

// biome-ignore lint/suspicious/noShadowRestrictedNames: This is a valid use case
export const Number: StoryObj<InputProps> = {
	args: {
		type: "number",
		placeholder: "Enter a number",
	},
};

export const Disabled: StoryObj<InputProps> = {
	args: {
		type: "text",
		placeholder: "Disabled input",
		disabled: true,
	},
};

export const Required: StoryObj<InputProps> = {
	args: {
		type: "text",
		placeholder: "Required input",
		required: true,
	},
};

export const WithLabel: StoryObj<InputProps> = {
	render: (args) => (
		<div>
			<label
				htmlFor="input-with-label"
				className="mb-1 block font-medium text-gray-700 text-sm"
			>
				Input Label
			</label>
			<Input id="input-with-label" {...args} />
		</div>
	),
	args: {
		type: "text",
		placeholder: "Input with label",
	},
};

export const FileInput: StoryObj<InputProps> = {
	args: {
		type: "file",
	},
};

export const CustomStyling: StoryObj<InputProps> = {
	args: {
		type: "text",
		placeholder: "Custom styled input",
		className: "border-blue-500 focus:ring-blue-500",
	},
};
