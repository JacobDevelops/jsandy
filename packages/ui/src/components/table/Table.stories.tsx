import type { Meta, StoryObj } from "@storybook/react";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "./Table";

const meta: Meta<typeof Table> = {
	title: "Components/Table",
	component: Table,
	tags: ["autodocs", "frequent", "narrow"],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
	render: () => (
		<Table>
			<TableCaption>A list of your recent invoices</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead className="w-[100px]">Invoice</TableHead>
					<TableHead>Status</TableHead>
					<TableHead>Method</TableHead>
					<TableHead className="text-right">Amount</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell className="font-medium">INV001</TableCell>
					<TableCell>Paid</TableCell>
					<TableCell>Credit Card</TableCell>
					<TableCell className="text-right">$250.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">INV002</TableCell>
					<TableCell>Pending</TableCell>
					<TableCell>PayPal</TableCell>
					<TableCell className="text-right">$150.00</TableCell>
				</TableRow>
				<TableRow>
					<TableCell className="font-medium">INV003</TableCell>
					<TableCell>Unpaid</TableCell>
					<TableCell>Bank Transfer</TableCell>
					<TableCell className="text-right">$350.00</TableCell>
				</TableRow>
			</TableBody>
			<TableFooter>
				<TableRow>
					<TableCell colSpan={3}>Total</TableCell>
					<TableCell className="text-right">$750.00</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	),
};

export const WithZebraStriping: Story = {
	render: () => (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead>Email</TableHead>
					<TableHead>Role</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{[
					"John Doe",
					"Jane Smith",
					"Bob Johnson",
					"Alice Brown",
					"Charlie Davis",
				].map((name, index) => (
					<TableRow key={name} className={index % 2 === 0 ? "bg-muted/50" : ""}>
						<TableCell>{name}</TableCell>
						<TableCell>
							{name.toLowerCase().replace(" ", ".")}@example.com
						</TableCell>
						<TableCell>
							{["Admin", "User", "Editor", "Viewer", "Manager"][index]}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	),
};

export const WithStickyHeader: Story = {
	render: () => (
		<div className="h-[300px] overflow-y-auto">
			<Table>
				<TableHeader className="sticky top-0 bg-background">
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Name</TableHead>
						<TableHead>Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{Array.from({ length: 50 }, (_, i) => i + 1).map((id) => (
						<TableRow key={id}>
							<TableCell>{id}</TableCell>
							<TableCell>Item {id}</TableCell>
							<TableCell>{id % 2 === 0 ? "Active" : "Inactive"}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	),
};

export const WithNestedData: Story = {
	render: () => (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Department</TableHead>
					<TableHead>Employees</TableHead>
					<TableHead>Budget</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<TableRow>
					<TableCell>Engineering</TableCell>
					<TableCell>
						<Table>
							<TableBody>
								<TableRow>
									<TableCell>Frontend</TableCell>
									<TableCell>5</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Backend</TableCell>
									<TableCell>7</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</TableCell>
					<TableCell>$1,000,000</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>Marketing</TableCell>
					<TableCell>
						<Table>
							<TableBody>
								<TableRow>
									<TableCell>Digital</TableCell>
									<TableCell>3</TableCell>
								</TableRow>
								<TableRow>
									<TableCell>Traditional</TableCell>
									<TableCell>2</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</TableCell>
					<TableCell>$500,000</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	),
};
