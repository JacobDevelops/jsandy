import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Presence } from "./Presence";

const meta: Meta<typeof Presence> = {
	title: "Components/Presence",
	component: Presence,
	tags: ["autodocs"],
	argTypes: {
		present: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof Presence>;

export const Default: Story = {
	render: ({ present }) => {
		const [isPresent, setIsPresent] = React.useState(present);

		React.useEffect(() => {
			setIsPresent(present);
		}, [present]);

		return (
			<div>
				<button type="button" onClick={() => setIsPresent(!isPresent)}>
					Toggle Presence
				</button>
				<Presence present={isPresent}>
					<div
						style={{
							marginTop: "20px",
							padding: "20px",
							background: "lightblue",
							borderRadius: "5px",
						}}
					>
						I&apos;m here when present is true!
					</div>
				</Presence>
			</div>
		);
	},
};

export const WithAnimation: Story = {
	render: ({ present }) => {
		const [isPresent, setIsPresent] = React.useState(present);

		React.useEffect(() => {
			setIsPresent(present);
		}, [present]);

		return (
			<div>
				<button type="button" onClick={() => setIsPresent(!isPresent)}>
					Toggle Presence
				</button>
				<Presence present={isPresent}>
					<div
						style={{
							marginTop: "20px",
							padding: "20px",
							background: "lightgreen",
							borderRadius: "5px",
							animation: isPresent ? "fadeIn 0.5s" : "fadeOut 0.5s",
						}}
					>
						Animated content
					</div>
				</Presence>
				<style>
					{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}
				</style>
			</div>
		);
	},
};

export const UsingRenderProp: Story = {
	render: ({ present }) => {
		const [isPresent, setIsPresent] = React.useState(present);

		React.useEffect(() => {
			setIsPresent(present);
		}, [present]);

		return (
			<div>
				<button type="button" onClick={() => setIsPresent(!isPresent)}>
					Toggle Presence
				</button>
				<Presence present={isPresent}>
					{({ present }) => (
						<div
							style={{
								marginTop: "20px",
								padding: "20px",
								background: "lightyellow",
								borderRadius: "5px",
								opacity: present ? 1 : 0,
								transition: "opacity 0.5s",
							}}
						>
							Content with dynamic opacity
						</div>
					)}
				</Presence>
			</div>
		);
	},
};

export const MultipleElements: Story = {
	render: () => {
		const [visibleItems, setVisibleItems] = React.useState<number[]>([]);

		const toggleItem = (index: number) => {
			setVisibleItems((prev) =>
				prev.includes(index)
					? prev.filter((i) => i !== index)
					: [...prev, index],
			);
		};

		return (
			<div>
				{[0, 1, 2].map((index) => (
					<div key={index} style={{ marginBottom: "10px" }}>
						<button type="button" onClick={() => toggleItem(index)}>
							Toggle Item {index + 1}
						</button>
						<Presence present={visibleItems.includes(index)}>
							<div
								style={{
									marginTop: "10px",
									padding: "10px",
									background: `hsl(${index * 120}, 70%, 80%)`,
									borderRadius: "5px",
									animation: visibleItems.includes(index)
										? "slideIn 0.3s"
										: "slideOut 0.3s",
								}}
							>
								Item {index + 1} Content
							</div>
						</Presence>
					</div>
				))}
				<style>
					{`
            @keyframes slideIn {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
            @keyframes slideOut {
              from { transform: translateX(0); }
              to { transform: translateX(-100%); }
            }
          `}
				</style>
			</div>
		);
	},
};

export const NestedPresence: Story = {
	render: ({ present }) => {
		const [outerPresent, setOuterPresent] = React.useState(present);
		const [innerPresent, setInnerPresent] = React.useState(false);

		React.useEffect(() => {
			setOuterPresent(present);
		}, [present]);

		return (
			<div>
				<button type="button" onClick={() => setOuterPresent(!outerPresent)}>
					Toggle Outer Presence
				</button>
				<Presence present={outerPresent}>
					<div
						style={{
							marginTop: "20px",
							padding: "20px",
							background: "lightcoral",
							borderRadius: "5px",
							animation: outerPresent ? "fadeIn 0.5s" : "fadeOut 0.5s",
						}}
					>
						<h3>Outer Content</h3>
						<button
							type="button"
							onClick={() => setInnerPresent(!innerPresent)}
						>
							Toggle Inner Presence
						</button>
						<Presence present={innerPresent}>
							<div
								style={{
									marginTop: "10px",
									padding: "10px",
									background: "lightblue",
									borderRadius: "5px",
									animation: innerPresent ? "slideIn 0.3s" : "slideOut 0.3s",
								}}
							>
								Inner Content
							</div>
						</Presence>
					</div>
				</Presence>
				<style>
					{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
            @keyframes slideIn {
              from { transform: translateY(-20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateY(0); opacity: 1; }
              to { transform: translateY(-20px); opacity: 0; }
            }
          `}
				</style>
			</div>
		);
	},
};
