import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const meta: Meta<typeof Tabs> = {
	title: "Components/Tabs",
	component: Tabs,
	tags: ["autodocs", "figma"],
	argTypes: {
		defaultValue: { control: "text" },
		orientation: {
			control: "radio",
			options: ["horizontal", "vertical"],
		},
		dir: {
			control: "radio",
			options: ["ltr", "rtl"],
		},
		activationMode: {
			control: "radio",
			options: ["automatic", "manual"],
		},
	},
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
	render: (args) => (
		<Tabs defaultValue="tab1" {...args}>
			<TabsList>
				<TabsTrigger value="tab1">Account</TabsTrigger>
				<TabsTrigger value="tab2">Password</TabsTrigger>
				<TabsTrigger value="tab3">Settings</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">Make changes to your account here.</TabsContent>
			<TabsContent value="tab2">Change your password here.</TabsContent>
			<TabsContent value="tab3">Edit your settings here.</TabsContent>
		</Tabs>
	),
};

export const Controlled: Story = {
	render: () => {
		const [activeTab, setActiveTab] = React.useState("tab1");
		return (
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value="tab1">Tab 1</TabsTrigger>
					<TabsTrigger value="tab2">Tab 2</TabsTrigger>
				</TabsList>
				<TabsContent value="tab1">Content for Tab 1</TabsContent>
				<TabsContent value="tab2">Content for Tab 2</TabsContent>
			</Tabs>
		);
	},
};

export const Vertical: Story = {
	render: (args) => (
		<Tabs defaultValue="tab1" orientation="vertical" {...args}>
			<TabsList className="flex-col">
				<TabsTrigger value="tab1">Tab 1</TabsTrigger>
				<TabsTrigger value="tab2">Tab 2</TabsTrigger>
				<TabsTrigger value="tab3">Tab 3</TabsTrigger>
			</TabsList>
			<div className="ml-4">
				<TabsContent value="tab1">Content for Tab 1</TabsContent>
				<TabsContent value="tab2">Content for Tab 2</TabsContent>
				<TabsContent value="tab3">Content for Tab 3</TabsContent>
			</div>
		</Tabs>
	),
};

export const WithDisabledTab: Story = {
	render: (args) => (
		<Tabs defaultValue="tab1" {...args}>
			<TabsList>
				<TabsTrigger value="tab1">Tab 1</TabsTrigger>
				<TabsTrigger value="tab2">Tab 2</TabsTrigger>
				<TabsTrigger value="tab3" disabled>
					Disabled Tab
				</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">Content for Tab 1</TabsContent>
			<TabsContent value="tab2">Content for Tab 2</TabsContent>
			<TabsContent value="tab3">Content for Disabled Tab</TabsContent>
		</Tabs>
	),
};

export const WithNestedContent: Story = {
	render: (args) => (
		<Tabs defaultValue="tab1" {...args}>
			<TabsList>
				<TabsTrigger value="tab1">User Info</TabsTrigger>
				<TabsTrigger value="tab2">Preferences</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<h3 className="mb-2 font-bold text-lg">User Information</h3>
				<form className="space-y-4">
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
			</TabsContent>
			<TabsContent value="tab2">
				<h3 className="mb-2 font-bold text-lg">User Preferences</h3>
				<ul className="space-y-2">
					<li className="flex items-center">
						<input type="checkbox" id="darkMode" className="mr-2" />
						<label htmlFor="darkMode">Enable Dark Mode</label>
					</li>
					<li className="flex items-center">
						<input type="checkbox" id="notifications" className="mr-2" />
						<label htmlFor="notifications">Receive Notifications</label>
					</li>
				</ul>
			</TabsContent>
		</Tabs>
	),
};
