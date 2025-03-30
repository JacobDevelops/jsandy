import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Textarea } from "./Textarea";

const meta: Meta<typeof Textarea> = {
	title: "Components/Textarea",
	component: Textarea,
	tags: ["autodocs", "figma"],
	argTypes: {
		placeholder: { control: "text" },
		disabled: { control: "boolean" },
		required: { control: "boolean" },
		rows: { control: "number" },
	},
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
	args: {
		placeholder: "Type your message here...",
	},
};

export const WithLabel: Story = {
	render: (args) => (
		<div className="space-y-2">
			<label
				htmlFor="message"
				className="block font-medium text-gray-700 text-sm"
			>
				Message
			</label>
			<Textarea id="message" {...args} />
		</div>
	),
	args: {
		placeholder: "Enter your message",
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
		value: "This textarea is disabled",
	},
};

export const Required: Story = {
	render: (args) => (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				alert("Form submitted!");
			}}
		>
			<div className="space-y-2">
				<label
					htmlFor="feedback"
					className="block font-medium text-gray-700 text-sm"
				>
					Feedback (required)
				</label>
				<Textarea id="feedback" required {...args} />
			</div>
			<button
				type="submit"
				className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
			>
				Submit
			</button>
		</form>
	),
	args: {
		placeholder: "Please provide your feedback",
	},
};

export const WithRows: Story = {
	args: {
		rows: 10,
		placeholder: "This textarea has 10 visible rows",
	},
};

export const Resizable: Story = {
	args: {
		placeholder: "This textarea is resizable",
		className: "resize-y",
	},
};

export const WithCharacterCount: Story = {
	render: () => {
		const [value, setValue] = React.useState("");
		const maxLength = 100;

		return (
			<div className="space-y-2">
				<label
					htmlFor="message-with-count"
					className="block font-medium text-gray-700 text-sm"
				>
					Message with character count
				</label>
				<Textarea
					id="message-with-count"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					maxLength={maxLength}
					placeholder="Enter your message"
				/>
				<p className="text-gray-500 text-sm">
					{value.length}/{maxLength} characters
				</p>
			</div>
		);
	},
};

export const WithCustomStyling: Story = {
	args: {
		placeholder: "Custom styled textarea",
		className: "border-blue-500 focus-visible:ring-blue-500",
	},
};

export const WithErrorState: Story = {
	render: () => {
		const [value, setValue] = React.useState("");
		const [error, setError] = React.useState("");

		const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setValue(e.target.value);
			if (e.target.value.length < 10) {
				setError("Message must be at least 10 characters long");
			} else {
				setError("");
			}
		};

		return (
			<div className="space-y-2">
				<label
					htmlFor="message-with-error"
					className="block font-medium text-gray-700 text-sm"
				>
					Message
				</label>
				<Textarea
					id="message-with-error"
					value={value}
					onChange={handleChange}
					placeholder="Enter at least 10 characters"
					className={error ? "border-red-500 focus-visible:ring-red-500" : ""}
				/>
				{error && <p className="text-red-500 text-sm">{error}</p>}
			</div>
		);
	},
};
