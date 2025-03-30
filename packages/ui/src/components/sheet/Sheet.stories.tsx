import { Button } from "@jsandy/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "./Sheet";

const meta: Meta<typeof SheetContent> = {
	title: "Components/Sheet",
	component: Sheet,
	tags: ["autodocs"],
	argTypes: {
		side: {
			control: "select",
			options: ["top", "right", "bottom", "left"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof SheetContent>;

export const Default: Story = {
	render: (args) => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Open Sheet</Button>
			</SheetTrigger>
			<SheetContent side={args.side}>
				<SheetHeader>
					<SheetTitle>Sheet Title</SheetTitle>
					<SheetDescription>
						This is a description of the sheet content.
					</SheetDescription>
				</SheetHeader>
				<div className="py-4">This is the main content of the sheet.</div>
				<SheetFooter>
					<SheetClose asChild>
						<Button variant="outline">Close</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	),
};

export const LeftSide: Story = {
	render: () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Open Left Sheet</Button>
			</SheetTrigger>
			<SheetContent side="left">
				<SheetHeader>
					<SheetTitle>Left Side Sheet</SheetTitle>
				</SheetHeader>
				<div className="py-4">This sheet slides in from the left side.</div>
			</SheetContent>
		</Sheet>
	),
};

export const TopSide: Story = {
	render: () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Open Top Sheet</Button>
			</SheetTrigger>
			<SheetContent side="top">
				<SheetHeader>
					<SheetTitle>Top Side Sheet</SheetTitle>
				</SheetHeader>
				<div className="py-4">This sheet slides in from the top.</div>
			</SheetContent>
		</Sheet>
	),
};

export const WithForm: Story = {
	render: () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Edit Profile</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Edit Profile</SheetTitle>
					<SheetDescription>
						Make changes to your profile here.
					</SheetDescription>
				</SheetHeader>
				<form className="space-y-4 py-4">
					<div>
						<label
							htmlFor="name"
							className="block font-medium text-gray-700 text-sm"
						>
							Name
						</label>
						<input
							type="text"
							id="name"
							className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-300 focus:ring-3 focus:ring-indigo-200 focus:ring-opacity-50"
						/>
					</div>
					<div>
						<label
							htmlFor="email"
							className="block font-medium text-gray-700 text-sm"
						>
							Email
						</label>
						<input
							type="email"
							id="email"
							className="mt-1 block w-full rounded-md border-gray-300 shadow-xs focus:border-indigo-300 focus:ring-3 focus:ring-indigo-200 focus:ring-opacity-50"
						/>
					</div>
				</form>
				<SheetFooter>
					<SheetClose asChild>
						<Button variant="outline">Cancel</Button>
					</SheetClose>
					<Button type="submit">Save Changes</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	),
};

export const NestedSheets: Story = {
	render: () => (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline">Open Main Sheet</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Main Sheet</SheetTitle>
				</SheetHeader>
				<div className="py-4">This is the main sheet content.</div>
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline">Open Nested Sheet</Button>
					</SheetTrigger>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>Nested Sheet</SheetTitle>
						</SheetHeader>
						<div className="py-4">This is a nested sheet.</div>
					</SheetContent>
				</Sheet>
			</SheetContent>
		</Sheet>
	),
};
