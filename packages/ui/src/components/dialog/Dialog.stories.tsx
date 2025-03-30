import { Button } from "@jsandy/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./Dialog";

const meta: Meta<typeof Dialog> = {
	title: "Components/Dialog",
	component: Dialog,
	tags: ["autodocs"],
	argTypes: {
		open: { control: "boolean" },
		modal: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
	render: (args) => (
		<Dialog {...args}>
			<DialogTrigger asChild>
				<Button variant="outline">Open Dialog</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="submit">Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};

export const WithForm: Story = {
	render: (args) => (
		<Dialog {...args}>
			<DialogTrigger asChild>
				<Button variant="outline">Edit Profile</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit profile</DialogTitle>
					<DialogDescription>
						Make changes to your profile here. Click save when you&apos;re done.
					</DialogDescription>
				</DialogHeader>
				<form className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor="name" className="text-right">
							Name
						</label>
						<input
							id="name"
							defaultValue="Pedro Duarte"
							className="col-span-3 rounded-md border px-3 py-2"
						/>
					</div>
					<div className="grid grid-cols-4 items-center gap-4">
						<label htmlFor="username" className="text-right">
							Username
						</label>
						<input
							id="username"
							defaultValue="@peduarte"
							className="col-span-3 rounded-md border px-3 py-2"
						/>
					</div>
				</form>
				<DialogFooter>
					<Button type="submit">Save changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};

export const LongContent: Story = {
	render: (args) => (
		<Dialog {...args}>
			<DialogTrigger asChild>
				<Button variant="outline">Open Dialog with Long Content</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Terms of Service</DialogTitle>
					<DialogDescription>
						Please read our terms and conditions carefully.
					</DialogDescription>
				</DialogHeader>
				<div className="max-h-[60vh] overflow-auto">
					<p className="mb-4">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
						auctor, nisl nec ultricies lacinia, nisl nisl aliquam nisl, nec
						aliquam nisl nisl sit amet nisl. Sed euismod, nisl nec ultricies
						lacinia, nisl nisl aliquam nisl, nec aliquam nisl nisl sit amet
						nisl.
					</p>
					{/* Repeat this paragraph multiple times to create long content */}
				</div>
				<DialogFooter>
					<Button type="submit">Accept</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};

export const NestedDialogs: Story = {
	render: (args) => (
		<Dialog {...args}>
			<DialogTrigger asChild>
				<Button variant="outline">Open First Dialog</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>First Dialog</DialogTitle>
					<DialogDescription>This is the first level dialog.</DialogDescription>
				</DialogHeader>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="outline">Open Nested Dialog</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Nested Dialog</DialogTitle>
							<DialogDescription>This is a nested dialog.</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button type="submit">Confirm</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DialogContent>
		</Dialog>
	),
};

export const CustomizedDialog: Story = {
	render: (args) => (
		<Dialog {...args}>
			<DialogTrigger asChild>
				<Button variant="outline">Open Customized Dialog</Button>
			</DialogTrigger>
			<DialogContent className="bg-primary text-primary-foreground">
				<DialogHeader>
					<DialogTitle className="font-bold text-2xl">
						Custom Styled Dialog
					</DialogTitle>
					<DialogDescription className="text-primary-foreground/70">
						This dialog has custom styling applied.
					</DialogDescription>
				</DialogHeader>
				<p className="my-4">
					You can customize the appearance of the Dialog component.
				</p>
				<DialogFooter>
					<Button variant="secondary">Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
};
