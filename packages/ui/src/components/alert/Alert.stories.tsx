import { Info } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./Alert";

const meta: Meta<typeof Alert> = {
	title: "Components/Alert",
	component: Alert,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: { type: "select" },
			options: ["default", "destructive"],
		},
	},
	parameters: {
		layout: "padded",
	},
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertTitle>Heads up!</AlertTitle>
			<AlertDescription>
				You can add components to your app using the cli.
			</AlertDescription>
		</Alert>
	),
	args: {
		variant: "default",
	},
};

export const Destructive: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				Your session has expired. Please log in again.
			</AlertDescription>
		</Alert>
	),
	args: {
		variant: "destructive",
	},
};

export const WithIcon: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>Information</AlertTitle>
			<AlertDescription>
				This is an informational alert with an icon.
			</AlertDescription>
		</Alert>
	),
	args: {
		variant: "default",
	},
};

export const TitleOnly: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertTitle>This is an alert with only a title.</AlertTitle>
		</Alert>
	),
	args: {
		variant: "default",
	},
};

export const DescriptionOnly: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertDescription>
				This is an alert with only a description.
			</AlertDescription>
		</Alert>
	),
	args: {
		variant: "default",
	},
};

export const CustomContent: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertTitle className="flex items-center gap-2">
				<CheckCircle className="h-4 w-4 text-green-500" />
				<span>Success</span>
			</AlertTitle>
			<AlertDescription>
				<p>Your changes have been saved successfully.</p>
				<button type="button" className="mt-2 font-medium text-sm underline">
					Undo
				</button>
			</AlertDescription>
		</Alert>
	),
	args: {
		variant: "default",
	},
};

export const MultipleAlerts: Story = {
	render: () => (
		<div className="space-y-4">
			<Alert variant="default">
				<Info className="h-4 w-4" />
				<AlertTitle>Information</AlertTitle>
				<AlertDescription>This is an informational alert.</AlertDescription>
			</Alert>
			<Alert variant="destructive">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Warning</AlertTitle>
				<AlertDescription>This action cannot be undone.</AlertDescription>
			</Alert>
			<Alert variant="default">
				<CheckCircle className="h-4 w-4 text-green-500" />
				<AlertTitle>Success</AlertTitle>
				<AlertDescription>Your profile has been updated.</AlertDescription>
			</Alert>
		</div>
	),
};

export const LongContent: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertTitle>Terms and Conditions</AlertTitle>
			<AlertDescription>
				<p>
					By using this application, you agree to our terms and conditions.
					These terms outline your rights and responsibilities as a user of our
					platform. Please read them carefully before proceeding.
				</p>
				<p className="mt-2">
					We reserve the right to modify these terms at any time. It is your
					responsibility to check for updates regularly. Continued use of the
					application after changes constitutes acceptance of the new terms.
				</p>
			</AlertDescription>
		</Alert>
	),
	args: {
		variant: "default",
	},
};

export const WithCloseButton: Story = {
	render: (args) => (
		<Alert {...args}>
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>Update Available</AlertTitle>
			<AlertDescription>
				A new software update is available. Would you like to install it now?
			</AlertDescription>
			<button
				type="button"
				className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<title>Close</title>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
				<span className="sr-only">Close</span>
			</button>
		</Alert>
	),
	args: {
		variant: "default",
	},
};
