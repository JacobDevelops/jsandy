import { User } from "lucide-react";
import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";

const meta: Meta<typeof Avatar> = {
	title: "Components/Avatar",
	component: Avatar,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
	render: (args) => (
		<Avatar {...args}>
			<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
			<AvatarFallback>CN</AvatarFallback>
		</Avatar>
	),
};

export const WithFallback: Story = {
	render: (args) => (
		<Avatar {...args}>
			<AvatarImage src="https://invalid-image-url.png" alt="Invalid Image" />
			<AvatarFallback>JD</AvatarFallback>
		</Avatar>
	),
};

export const Sizes: Story = {
	render: (args) => (
		<div className="flex items-center gap-4">
			<Avatar className="h-8 w-8" {...args}>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>SM</AvatarFallback>
			</Avatar>
			<Avatar {...args}>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>MD</AvatarFallback>
			</Avatar>
			<Avatar className="h-14 w-14" {...args}>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>LG</AvatarFallback>
			</Avatar>
		</div>
	),
};

export const WithDelay: Story = {
	render: (args) => (
		<Avatar {...args}>
			<AvatarImage src="https://invalid-image-url.png" alt="Invalid Image" />
			<AvatarFallback delayMs={600}>
				This fallback will appear after 600ms
			</AvatarFallback>
		</Avatar>
	),
};

export const Group: Story = {
	render: (args) => (
		<div className="-space-x-2 flex">
			<Avatar className="border-2 border-background" {...args}>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>CN</AvatarFallback>
			</Avatar>
			<Avatar className="border-2 border-background" {...args}>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>JD</AvatarFallback>
			</Avatar>
			<Avatar className="border-2 border-background" {...args}>
				<AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
				<AvatarFallback>SK</AvatarFallback>
			</Avatar>
			<Avatar
				className="flex items-center justify-center border-2 border-background bg-muted"
				{...args}
			>
				<span className="font-medium text-xs">+3</span>
			</Avatar>
		</div>
	),
};

export const WithIcon: Story = {
	render: (args) => (
		<Avatar {...args}>
			<AvatarFallback>
				<User className="h-6 w-6" />
			</AvatarFallback>
		</Avatar>
	),
};

export const CustomColors: Story = {
	render: (args) => (
		<div className="flex items-center gap-4">
			<Avatar className="bg-blue-500 text-white" {...args}>
				<AvatarFallback>AB</AvatarFallback>
			</Avatar>
			<Avatar className="bg-green-500 text-white" {...args}>
				<AvatarFallback>CD</AvatarFallback>
			</Avatar>
			<Avatar className="bg-purple-500 text-white" {...args}>
				<AvatarFallback>EF</AvatarFallback>
			</Avatar>
			<Avatar className="bg-amber-500 text-white" {...args}>
				<AvatarFallback>GH</AvatarFallback>
			</Avatar>
		</div>
	),
};

export const ErrorHandling: Story = {
	render: (args) => (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-4">
				<Avatar {...args}>
					{/* This will show fallback */}
					<AvatarImage src="" alt="Missing Image" />
					<AvatarFallback>Missing</AvatarFallback>
				</Avatar>
				<span>Missing image source</span>
			</div>

			<div className="flex items-center gap-4">
				<Avatar {...args}>
					{/* This will show fallback */}
					<AvatarImage src="https://invalid-image-url.png" alt="404 Image" />
					<AvatarFallback>404</AvatarFallback>
				</Avatar>
				<span>Invalid image URL</span>
			</div>
		</div>
	),
};

export const WithRoundedCorners: Story = {
	render: (args) => (
		<Avatar className="rounded-md" {...args}>
			<AvatarImage
				src="https://github.com/shadcn.png"
				alt="@shadcn"
				className="rounded-md"
			/>
			<AvatarFallback className="rounded-md">CN</AvatarFallback>
		</Avatar>
	),
	name: "Rounded Corners (non-circular)",
};
