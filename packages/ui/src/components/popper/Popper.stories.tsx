import type { Meta, StoryObj } from "@storybook/react";
import { Popper, PopperAnchor, PopperArrow, PopperContent } from "./Popper";

const meta: Meta<typeof PopperContent> = {
	title: "Components/Popper",
	component: Popper,
	tags: ["autodocs"],
	argTypes: {
		side: {
			control: "select",
			options: ["top", "right", "bottom", "left"],
			defaultValue: "bottom",
		},
		align: {
			control: "select",
			options: ["start", "center", "end"],
			defaultValue: "center",
		},
		sideOffset: {
			control: "number",
			defaultValue: 5,
		},
		alignOffset: {
			control: "number",
			defaultValue: 0,
		},
	},
};

export default meta;
type Story = StoryObj<typeof PopperContent>;

export const Default: Story = {
	render: (args) => (
		<div
			style={{ padding: "100px", display: "flex", justifyContent: "center" }}
		>
			<Popper>
				<PopperAnchor>
					<button
						type="button"
						className="rounded bg-blue-500 px-4 py-2 text-white"
					>
						Hover me
					</button>
				</PopperAnchor>
				<PopperContent
					className="rounded bg-white p-4 shadow-lg"
					side={args.side}
					align={args.align}
					sideOffset={args.sideOffset}
					alignOffset={args.alignOffset}
				>
					This is the popper content
					<PopperArrow className="fill-white" />
				</PopperContent>
			</Popper>
		</div>
	),
};

export const WithArrow: Story = {
	render: (args) => (
		<div
			style={{ padding: "100px", display: "flex", justifyContent: "center" }}
		>
			<Popper>
				<PopperAnchor>
					<button
						type="button"
						className="rounded bg-green-500 px-4 py-2 text-white"
					>
						Click me
					</button>
				</PopperAnchor>
				<PopperContent
					className="rounded bg-white p-4 shadow-lg"
					side={args.side}
					align={args.align}
					sideOffset={args.sideOffset ?? 0 + 5} // Add 5px to account for arrow
					alignOffset={args.alignOffset}
				>
					Popper with arrow
					<PopperArrow className="fill-white" />
				</PopperContent>
			</Popper>
		</div>
	),
};

export const AvoidCollisions: Story = {
	render: () => (
		<div
			style={{ padding: "20px", display: "flex", justifyContent: "flex-start" }}
		>
			<Popper>
				<PopperAnchor>
					<button
						type="button"
						className="rounded bg-red-500 px-4 py-2 text-white"
					>
						Hover near edge
					</button>
				</PopperAnchor>
				<PopperContent
					className="rounded bg-white p-4 shadow-lg"
					avoidCollisions
					collisionPadding={10}
				>
					This popper avoids collisions with the viewport edges
					<PopperArrow className="fill-white" />
				</PopperContent>
			</Popper>
		</div>
	),
};

export const CustomStyling: Story = {
	render: () => (
		<div
			style={{ padding: "100px", display: "flex", justifyContent: "center" }}
		>
			<Popper>
				<PopperAnchor>
					<button
						type="button"
						className="rounded bg-purple-500 px-4 py-2 text-white"
					>
						Hover for custom style
					</button>
				</PopperAnchor>
				<PopperContent
					className="rounded-lg bg-linear-to-r from-purple-500 to-pink-500 p-4 text-white shadow-lg"
					sideOffset={10}
				>
					<h3 className="mb-2 font-bold text-lg">Custom Styled Popper</h3>
					<p>This popper has custom styling applied.</p>
					<PopperArrow className="fill-purple-500" />
				</PopperContent>
			</Popper>
		</div>
	),
};

export const InteractiveContent: Story = {
	render: () => (
		<div
			style={{ padding: "100px", display: "flex", justifyContent: "center" }}
		>
			<Popper>
				<PopperAnchor>
					<button
						type="button"
						className="rounded bg-blue-500 px-4 py-2 text-white"
					>
						Open interactive popper
					</button>
				</PopperAnchor>
				<PopperContent
					className="rounded bg-white p-4 shadow-lg"
					sideOffset={10}
				>
					<h3 className="mb-2 font-bold text-lg">Interactive Popper</h3>
					<p className="mb-4">This popper contains interactive elements.</p>
					<button
						type="button"
						className="rounded bg-blue-500 px-4 py-2 text-white"
						onClick={() => alert("Button clicked!")}
					>
						Click me
					</button>
					<PopperArrow className="fill-white" />
				</PopperContent>
			</Popper>
		</div>
	),
};

export const NestedPoppers: Story = {
	render: () => (
		<div
			style={{ padding: "100px", display: "flex", justifyContent: "center" }}
		>
			<Popper>
				<PopperAnchor>
					<button
						type="button"
						className="rounded bg-blue-500 px-4 py-2 text-white"
					>
						Open nested poppers
					</button>
				</PopperAnchor>
				<PopperContent
					className="rounded bg-white p-4 shadow-lg"
					sideOffset={10}
				>
					<h3 className="mb-2 font-bold text-lg">First Level Popper</h3>
					<Popper>
						<PopperAnchor>
							<button
								type="button"
								className="rounded bg-green-500 px-4 py-2 text-white"
							>
								Open second level
							</button>
						</PopperAnchor>
						<PopperContent
							className="rounded bg-white p-4 shadow-lg"
							side="right"
							sideOffset={10}
						>
							<h4 className="mb-2 font-bold text-md">Second Level Popper</h4>
							<p>This is a nested popper.</p>
							<PopperArrow className="fill-white" />
						</PopperContent>
					</Popper>
					<PopperArrow className="fill-white" />
				</PopperContent>
			</Popper>
		</div>
	),
};
