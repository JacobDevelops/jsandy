import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "./Skeleton";

const meta: Meta<typeof Skeleton> = {
	title: "Components/Skeleton",
	component: Skeleton,
	tags: ["autodocs"],
	argTypes: {
		className: { control: "text" },
	},
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
	render: (args) => (
		<Skeleton className="h-4" style={{ width: "250px" }} {...args} />
	),
};

export const TextPlaceholder: Story = {
	render: () => (
		<div className="space-y-2">
			<Skeleton className="h-4" style={{ width: "250px" }} />
			<Skeleton className="h-4" style={{ width: "200px" }} />
			<Skeleton className="h-4" style={{ width: "300px" }} />
		</div>
	),
};

export const CardWithImageAndText: Story = {
	render: () => (
		<div
			className="card overflow-hidden rounded-lg border"
			style={{ width: "300px" }}
		>
			<Skeleton className="h-48 w-full" />
			<div className="space-y-2 p-4">
				<Skeleton className="h-4 w-3/4" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-1/2" />
			</div>
		</div>
	),
};

export const AvatarAndText: Story = {
	render: () => (
		<div className="flex items-center space-x-4">
			<Skeleton className="h-12 w-12 rounded-full" />
			<div className="space-y-2">
				<Skeleton className="h-4" style={{ width: "200px" }} />
				<Skeleton className="h-4" style={{ width: "150px" }} />
			</div>
		</div>
	),
};

export const TableLoading: Story = {
	render: () => (
		<div className="space-y-4">
			<div className="flex space-x-4">
				<Skeleton className="h-4" style={{ width: "100px" }} />
				<Skeleton className="h-4" style={{ width: "100px" }} />
				<Skeleton className="h-4" style={{ width: "100px" }} />
			</div>
			{[...Array(5)].map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: This is a storybook example
				<div key={i} className="flex space-x-4">
					<Skeleton className="h-4" style={{ width: "100px" }} />
					<Skeleton className="h-4" style={{ width: "100px" }} />
					<Skeleton className="h-4" style={{ width: "100px" }} />
				</div>
			))}
		</div>
	),
};

export const ButtonLoading: Story = {
	render: () => (
		<div className="space-y-4">
			<Skeleton className="h-10 rounded-md" style={{ width: "120px" }} />
			<Skeleton className="h-10 rounded-md" style={{ width: "150px" }} />
		</div>
	),
};

export const ComplexLayout: Story = {
	render: () => (
		<div className="space-y-8">
			<div className="mb-8 flex items-center space-x-4">
				<Skeleton className="mr-4 h-12 w-12 rounded-full" />
				<div className="space-y-2">
					<Skeleton className="mb-2 h-4" style={{ width: "200px" }} />
					<Skeleton className="mb-2 h-4" style={{ width: "150px" }} />
				</div>
			</div>
			<div className="mb-8 space-y-2">
				<Skeleton className="mb-2 h-4 w-full" />
				<Skeleton className="mb-2 h-4 w-full" />
				<Skeleton className="mb-2 h-4 w-3/4" />
			</div>
			<div className="grid grid-cols-3 gap-4">
				<Skeleton className="mb-2 h-32 w-full rounded-md" />
				<Skeleton className="mb-2 h-32 w-full rounded-md" />
				<Skeleton className="mb-2 h-32 w-full rounded-md" />
			</div>
		</div>
	),
};
