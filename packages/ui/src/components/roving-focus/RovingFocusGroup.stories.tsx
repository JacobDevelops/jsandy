import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { RovingFocusGroup, RovingFocusGroupItem } from "./RovingFocusGroup";

const meta: Meta<typeof RovingFocusGroup> = {
	title: "Components/RovingFocusGroup",
	component: RovingFocusGroup,
	tags: ["autodocs", "roving-focus"],
	argTypes: {
		orientation: {
			control: "radio",
			options: ["horizontal", "vertical"],
		},
		dir: {
			control: "radio",
			options: ["ltr", "rtl"],
		},
		loop: {
			control: "boolean",
		},
	},
};

export default meta;
type Story = StoryObj<typeof RovingFocusGroup>;

export const Default: Story = {
	render: (args) => (
		<RovingFocusGroup {...args}>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
				>
					Item 1
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
				>
					Item 2
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="rounded bg-blue-500 px-4 py-2 text-white"
				>
					Item 3
				</button>
			</RovingFocusGroupItem>
		</RovingFocusGroup>
	),
};

export const VerticalMenu: Story = {
	render: () => (
		<RovingFocusGroup orientation="vertical">
			<RovingFocusGroupItem>
				<button
					type="button"
					className="mb-2 w-full bg-gray-200 px-4 py-2 text-left hover:bg-gray-300"
				>
					Profile
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="mb-2 w-full bg-gray-200 px-4 py-2 text-left hover:bg-gray-300"
				>
					Settings
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="w-full bg-gray-200 px-4 py-2 text-left hover:bg-gray-300"
				>
					Logout
				</button>
			</RovingFocusGroupItem>
		</RovingFocusGroup>
	),
};

export const LoopingToolbar: Story = {
	render: () => (
		<RovingFocusGroup orientation="horizontal" loop>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="rounded-l bg-gray-200 px-3 py-1 hover:bg-gray-300"
				>
					<strong>B</strong>
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="bg-gray-200 px-3 py-1 hover:bg-gray-300"
				>
					<i>I</i>
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="rounded-r bg-gray-200 px-3 py-1 hover:bg-gray-300"
				>
					<u>U</u>
				</button>
			</RovingFocusGroupItem>
		</RovingFocusGroup>
	),
};

export const WithDisabledItems: Story = {
	render: () => (
		<RovingFocusGroup orientation="horizontal">
			<RovingFocusGroupItem>
				<button
					type="button"
					className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
				>
					Enabled
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem focusable={false}>
				<button
					type="button"
					className="mr-2 cursor-not-allowed rounded bg-gray-400 px-4 py-2 text-gray-600"
					disabled
				>
					Disabled
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="rounded bg-blue-500 px-4 py-2 text-white"
				>
					Enabled
				</button>
			</RovingFocusGroupItem>
		</RovingFocusGroup>
	),
};

export const ControlledTabStops: Story = {
	render: () => {
		const [currentTabStopId, setCurrentTabStopId] = React.useState<
			string | null
		>("item1");

		return (
			<RovingFocusGroup
				orientation="horizontal"
				currentTabStopId={currentTabStopId}
				onCurrentTabStopIdChange={setCurrentTabStopId}
			>
				<RovingFocusGroupItem tabStopId="item1">
					<button
						type="button"
						className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
					>
						Item 1
					</button>
				</RovingFocusGroupItem>
				<RovingFocusGroupItem tabStopId="item2">
					<button
						type="button"
						className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
					>
						Item 2
					</button>
				</RovingFocusGroupItem>
				<RovingFocusGroupItem tabStopId="item3">
					<button
						type="button"
						className="rounded bg-blue-500 px-4 py-2 text-white"
					>
						Item 3
					</button>
				</RovingFocusGroupItem>
			</RovingFocusGroup>
		);
	},
};

export const NestedGroups: Story = {
	render: () => (
		<RovingFocusGroup orientation="vertical">
			<RovingFocusGroupItem>
				<button
					type="button"
					className="mb-2 w-full bg-gray-200 px-4 py-2 text-left hover:bg-gray-300"
				>
					Option 1
				</button>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<div>
					<button
						type="button"
						className="mb-2 w-full bg-gray-200 px-4 py-2 text-left hover:bg-gray-300"
					>
						Option 2 (Nested)
					</button>
					<RovingFocusGroup orientation="horizontal" className="ml-4">
						<RovingFocusGroupItem>
							<button
								type="button"
								className="rounded-l bg-blue-200 px-3 py-1 hover:bg-blue-300"
							>
								Nested 1
							</button>
						</RovingFocusGroupItem>
						<RovingFocusGroupItem>
							<button
								type="button"
								className="bg-blue-200 px-3 py-1 hover:bg-blue-300"
							>
								Nested 2
							</button>
						</RovingFocusGroupItem>
						<RovingFocusGroupItem>
							<button
								type="button"
								className="rounded-r bg-blue-200 px-3 py-1 hover:bg-blue-300"
							>
								Nested 3
							</button>
						</RovingFocusGroupItem>
					</RovingFocusGroup>
				</div>
			</RovingFocusGroupItem>
			<RovingFocusGroupItem>
				<button
					type="button"
					className="w-full bg-gray-200 px-4 py-2 text-left hover:bg-gray-300"
				>
					Option 3
				</button>
			</RovingFocusGroupItem>
		</RovingFocusGroup>
	),
};
