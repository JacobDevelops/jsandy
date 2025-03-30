import { Button } from "@jsandy/ui/button";
import { Input } from "@jsandy/ui/input";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "./DropdownMenu";

const meta: Meta<typeof DropdownMenu> = {
	title: "Components/DropdownMenu",
	component: DropdownMenu,
	tags: ["autodocs"],
	argTypes: {
		open: { control: "boolean" },
		modal: { control: "boolean" },
	},
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
	render: (args) => (
		<DropdownMenu {...args}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Open Menu</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuItem>New Tab</DropdownMenuItem>
				<DropdownMenuItem>New Window</DropdownMenuItem>
				<DropdownMenuItem disabled>New Private Window</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					Settings
					<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};

export const WithCheckboxItems: Story = {
	render: (args) => {
		const options = ["Crows", "Ravens", "Magpies", "Jackdaws"];
		const [selection, setSelection] = useState<string[]>([]);

		const handleSelectAll = () => {
			setSelection((currentSelection) =>
				currentSelection.length === options.length ? [] : options,
			);
		};

		return (
			<DropdownMenu {...args}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline">Select Birds</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<DropdownMenuLabel>Corvids</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuCheckboxItem
						checked={
							selection.length === options.length
								? true
								: selection.length
									? "indeterminate"
									: false
						}
						onCheckedChange={handleSelectAll}
					>
						Select all
					</DropdownMenuCheckboxItem>
					<DropdownMenuSeparator />
					{options.map((option) => (
						<DropdownMenuCheckboxItem
							key={option}
							checked={selection.includes(option)}
							onCheckedChange={() =>
								setSelection((current) =>
									current.includes(option)
										? current.filter((el) => el !== option)
										: current.concat(option),
								)
							}
						>
							{option}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	},
};

export const WithRadioItems: Story = {
	render: (args) => {
		const options = ["Light", "Dark", "System"];
		const [selection, setSelection] = useState<string>("Light");
		return (
			<DropdownMenu {...args}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline">Open Menu</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<DropdownMenuLabel>Theme</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup
						value={selection}
						onValueChange={setSelection}
					>
						{options.map((option) => (
							<DropdownMenuRadioItem key={option} value={option}>
								{option}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	},
};

export const WithSubMenu: Story = {
	render: (args) => (
		<DropdownMenu {...args}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Open Menu</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuItem>New Tab</DropdownMenuItem>
				<DropdownMenuItem>New Window</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>More Tools</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuItem>Save Page As...</DropdownMenuItem>
							<DropdownMenuItem>Create Shortcut...</DropdownMenuItem>
							<DropdownMenuItem>Name Window...</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>Developer Tools</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem>Settings</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};

export const ComplexMenu: Story = {
	render: (args) => (
		<DropdownMenu {...args}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Open Complex Menu</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>
						Profile
						<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Billing
						<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Settings
						<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>Team</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuItem>Email</DropdownMenuItem>
								<DropdownMenuItem>Message</DropdownMenuItem>
								<DropdownMenuItem>More...</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem>
					Log out
					<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};

export const WithSearch: Story = {
	render: (args) => {
		const [searchTerm, setSearchTerm] = useState("");
		const options = [
			"Apple",
			"Banana",
			"Cherry",
			"Date",
			"Elderberry",
			"Fig",
			"Grape",
		];
		const filteredOptions = options.filter((option) =>
			option.toLowerCase().includes(searchTerm.toLowerCase()),
		);

		return (
			<DropdownMenu {...args}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline">Search Fruits</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56">
					<div className="p-2">
						<Input
							type="search"
							placeholder="Search..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<DropdownMenuSeparator />
					{filteredOptions.map((option) => (
						<DropdownMenuItem key={option}>{option}</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	},
};

export const MultiLevel: Story = {
	render: (args) => (
		<DropdownMenu {...args}>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">Open Multi-Level Menu</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuItem>Item 1</DropdownMenuItem>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuItem>Sub-Item 1</DropdownMenuItem>
							<DropdownMenuSub>
								<DropdownMenuSubTrigger>
									Even More Options
								</DropdownMenuSubTrigger>
								<DropdownMenuPortal>
									<DropdownMenuSubContent>
										<DropdownMenuItem>Sub-Sub-Item 1</DropdownMenuItem>
										<DropdownMenuItem>Sub-Sub-Item 2</DropdownMenuItem>
									</DropdownMenuSubContent>
								</DropdownMenuPortal>
							</DropdownMenuSub>
							<DropdownMenuItem>Sub-Item 2</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
				<DropdownMenuItem>Item 2</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
};
