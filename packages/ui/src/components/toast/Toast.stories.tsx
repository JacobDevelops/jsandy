import { Button } from "@jsandy/ui/button";
import type { Meta, StoryObj } from "@storybook/react";
import { Toast, ToastAction } from "./Toast";
import { Toaster } from "./Toaster";
import { useToast } from "./useToast";

const meta: Meta<typeof Toast> = {
	title: "Components/Toast",
	component: Toast,
	tags: ["autodocs", "figma"],
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<div
				style={{ padding: "20px", position: "relative", minHeight: "100vh" }}
			>
				<Story />
				<Toaster />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof Toast>;

const ToastTrigger = ({ action }: { action: () => void }) => {
	return <Button onClick={action}>Show Toast</Button>;
};

export const SuccessToast: Story = {
	render: () => {
		const { toast } = useToast();
		const showToast = () => {
			toast({
				title: "Success!",
				description: "Your changes have been saved successfully.",
			});
		};
		return <ToastTrigger action={showToast} />;
	},
};

export const DestructiveToast: Story = {
	render: () => {
		const { toast } = useToast();
		const showToast = () => {
			toast({
				title: "Error",
				description: "There was a problem with your request.",
				variant: "destructive",
			});
		};
		return <ToastTrigger action={showToast} />;
	},
};

export const ToastWithAction: Story = {
	render: () => {
		const { toast } = useToast();
		const showToast = () => {
			toast({
				title: "Scheduled: Catch up",
				description: "Friday, February 10, 2023 at 5:57 PM",
				action: <ToastAction altText="Goto schedule to undo">Undo</ToastAction>,
			});
		};
		return <ToastTrigger action={showToast} />;
	},
};

export const CustomDurationToast: Story = {
	render: () => {
		const { toast } = useToast();
		const showToast = () => {
			toast({
				title: "Custom Duration",
				description: "This toast will disappear in 10 seconds",
				duration: 10000,
			});
		};
		return <ToastTrigger action={showToast} />;
	},
};

export const MultipleToasts: Story = {
	render: () => {
		const { toast } = useToast();
		const showToasts = () => {
			toast({ title: "Toast 1", description: "First toast" });
			setTimeout(() => {
				toast({ title: "Toast 2", description: "Second toast" });
			}, 1000);
			setTimeout(() => {
				toast({ title: "Toast 3", description: "Third toast" });
			}, 2000);
		};
		return <ToastTrigger action={showToasts} />;
	},
};

export const ToastWithCustomContent: Story = {
	render: () => {
		const { toast } = useToast();
		const showToast = () => {
			toast({
				title: "Custom Content",
				description: (
					<div className="flex items-center">
						<span className="mr-2">🎉</span>
						<span>Congratulations! You&apos;ve won a prize!</span>
					</div>
				),
			});
		};
		return <ToastTrigger action={showToast} />;
	},
};
