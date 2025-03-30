import { buttonVariants } from "@jsandy/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./AlertDialog";

const meta: Meta<typeof AlertDialog> = {
	title: "Components/AlertDialog",
	component: AlertDialog,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AlertDialog>;

export const Default: Story = {
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger>Open Alert Dialog</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className={buttonVariants({ variant: "destructive" })}
					>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
};

export const CustomStyling: Story = {
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger className="rounded bg-blue-500 px-4 py-2 text-white">
				Open Custom Alert Dialog
			</AlertDialogTrigger>
			<AlertDialogContent className="border-2 border-blue-500 bg-gray-100">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-2xl text-blue-700">
						Custom Styled Dialog
					</AlertDialogTitle>
					<AlertDialogDescription className="text-gray-600">
						This is an example of a custom styled alert dialog. You can adjust
						the styling to match your design system.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="bg-gray-300 text-gray-800">
						Nevermind
					</AlertDialogCancel>
					<AlertDialogAction className="bg-blue-500 text-white">
						Proceed
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
};

export const WithForm: Story = {
	render: () => (
		<AlertDialog>
			<AlertDialogTrigger>Open Form Dialog</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Enter your details</AlertDialogTitle>
					<AlertDialogDescription>
						Please provide your name and email to proceed.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<form className="space-y-4">
					<input
						type="text"
						placeholder="Your Name"
						className="w-full rounded border px-3 py-2"
					/>
					<input
						type="email"
						placeholder="Your Email"
						className="w-full rounded border px-3 py-2"
					/>
				</form>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction>Submit</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	),
};
