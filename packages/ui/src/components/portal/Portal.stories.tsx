import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Portal } from "./Portal";

const meta: Meta<typeof Portal> = {
	title: "Components/Portal",
	component: Portal,
	tags: ["autodocs"],
	argTypes: {
		container: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof Portal>;

export const Default: Story = {
	render: () => (
		<div style={{ border: "1px solid black", padding: "10px" }}>
			<h2>Parent Component</h2>
			<Portal>
				<div
					style={{
						position: "fixed",
						top: "10px",
						right: "10px",
						background: "lightblue",
						padding: "10px",
					}}
				>
					This content is rendered outside the parent component
				</div>
			</Portal>
		</div>
	),
};

export const WithCustomContainer: Story = {
	render: () => {
		const [container, setContainer] = React.useState<HTMLElement | null>(null);

		React.useEffect(() => {
			const el = document.getElementById("custom-portal-container");
			setContainer(el);
		}, []);

		return (
			<div>
				<div
					style={{
						border: "1px solid black",
						padding: "10px",
						marginBottom: "20px",
					}}
				>
					<h2>Parent Component</h2>
				</div>
				<div
					id="custom-portal-container"
					style={{ border: "1px dashed red", padding: "10px" }}
				>
					<h3>Custom Container</h3>
				</div>
				<Portal container={container}>
					<div
						style={{
							background: "lightgreen",
							padding: "10px",
							marginTop: "10px",
						}}
					>
						This content is rendered in the custom container
					</div>
				</Portal>
			</div>
		);
	},
};

export const ModalExample: Story = {
	render: () => {
		const [isOpen, setIsOpen] = React.useState(false);

		return (
			<div>
				<button type="button" onClick={() => setIsOpen(true)}>
					Open Modal
				</button>
				{isOpen && (
					<Portal>
						<div
							style={{
								position: "fixed",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								background: "rgba(0, 0, 0, 0.5)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								style={{
									background: "white",
									padding: "20px",
									borderRadius: "5px",
								}}
							>
								<h2>Modal Title</h2>
								<p>This is a modal rendered using Portal.</p>
								<button type="button" onClick={() => setIsOpen(false)}>
									Close Modal
								</button>
							</div>
						</div>
					</Portal>
				)}
			</div>
		);
	},
};

export const MultiplePortals: Story = {
	render: () => (
		<div style={{ border: "1px solid black", padding: "10px" }}>
			<h2>Parent Component</h2>
			<Portal>
				<div
					style={{
						position: "fixed",
						top: "10px",
						right: "10px",
						background: "lightblue",
						padding: "10px",
					}}
				>
					First Portal
				</div>
			</Portal>
			<Portal>
				<div
					style={{
						position: "fixed",
						bottom: "10px",
						left: "10px",
						background: "lightgreen",
						padding: "10px",
					}}
				>
					Second Portal
				</div>
			</Portal>
		</div>
	),
};

export const DynamicContent: Story = {
	render: () => {
		const [count, setCount] = React.useState(0);

		return (
			<div style={{ border: "1px solid black", padding: "10px" }}>
				<h2>Parent Component</h2>
				<button type="button" onClick={() => setCount((c) => c + 1)}>
					Increment Count
				</button>
				<Portal>
					<div
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							background: "lightyellow",
							padding: "10px",
						}}
					>
						Count in Portal: {count}
					</div>
				</Portal>
			</div>
		);
	},
};
