import type { Meta, StoryObj } from "@storybook/react";
import { Label, type LabelProps } from "./Label";

const meta: Meta<typeof Label> = {
	title: "Components/Label",
	component: Label,
	tags: ["autodocs"],
	argTypes: {
		htmlFor: {
			control: "text",
			description: "The ID of the associated form control",
		},
		children: {
			control: "text",
			description: "The content of the label",
		},
	},
};

export default meta;

export const Default: StoryObj<LabelProps> = {
	args: {
		htmlFor: "default-input",
		children: "Default Label",
	},
	render: (args) => (
		<div>
			<Label {...args} />
			<input
				id={args.htmlFor}
				className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-sky-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
			/>
		</div>
	),
};

export const Required: StoryObj<LabelProps> = {
	args: {
		htmlFor: "required-input",
		children: "Required Field",
	},
	render: (args) => (
		<div>
			<Label {...args}>
				{args.children} <span className="text-red-500">*</span>
			</Label>
			<input
				id={args.htmlFor}
				required
				className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-sky-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
			/>
		</div>
	),
};

export const WithHelpText: StoryObj<LabelProps> = {
	args: {
		htmlFor: "help-input",
		children: "Password",
	},
	render: (args) => (
		<div>
			<Label {...args} />
			<input
				id={args.htmlFor}
				type="password"
				className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-sky-500 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
			/>
			<p className="mt-2 text-gray-500 text-sm">
				Password must be at least 8 characters long.
			</p>
		</div>
	),
};

export const DisabledInput: StoryObj<LabelProps> = {
	args: {
		htmlFor: "disabled-input",
		children: "Disabled Input",
	},
	render: (args) => (
		<div>
			<Label {...args} />
			<input
				id={args.htmlFor}
				disabled
				className="mt-1 block w-full rounded-md border border-slate-300 bg-gray-100 px-3 py-2 text-gray-500 text-sm placeholder-slate-400 shadow-xs"
			/>
		</div>
	),
};

export const WithCheckbox: StoryObj<LabelProps> = {
	args: {
		htmlFor: "checkbox-input",
		children: "Accept terms and conditions",
	},
	render: (args) => (
		<div className="flex items-center">
			<input
				id={args.htmlFor}
				type="checkbox"
				className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
			/>
			<Label {...args} className="ml-2" />
		</div>
	),
};

export const WithRadio: StoryObj<LabelProps> = {
	render: () => (
		<div className="space-y-2">
			<div className="flex items-center">
				<input
					id="option1"
					name="radio-group"
					type="radio"
					className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<Label htmlFor="option1" className="ml-2">
					Option 1
				</Label>
			</div>
			<div className="flex items-center">
				<input
					id="option2"
					name="radio-group"
					type="radio"
					className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				<Label htmlFor="option2" className="ml-2">
					Option 2
				</Label>
			</div>
		</div>
	),
};

export const CustomStyling: StoryObj<LabelProps> = {
	args: {
		htmlFor: "custom-input",
		children: "Custom Styled Label",
		className: "text-lg font-bold text-purple-600",
	},
	render: (args) => (
		<div>
			<Label {...args} />
			<input
				id={args.htmlFor}
				className="mt-1 block w-full rounded-md border border-purple-300 bg-white px-3 py-2 text-sm placeholder-purple-400 shadow-sm focus:border-purple-500 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
			/>
		</div>
	),
};
