import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./Pagination";

const meta: Meta<typeof Pagination> = {
	title: "Components/Pagination",
	component: Pagination,
	argTypes: {
		className: { control: "text" },
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
	render: () => (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">1</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" isActive>
						2
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">3</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
};

export const WithManyPages: Story = {
	render: () => (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">1</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">2</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" isActive>
						3
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">4</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">5</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">10</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
};

export const SimpleNavigation: Story = {
	render: () => (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
};

export const CustomStyling: Story = {
	render: () => (
		<Pagination className="rounded-lg bg-gray-100 p-4">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						className="bg-blue-500 text-white hover:bg-blue-600"
					/>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" className="bg-gray-200 hover:bg-gray-300">
						1
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" isActive className="bg-blue-500 text-white">
						2
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" className="bg-gray-200 hover:bg-gray-300">
						3
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext
						href="#"
						className="bg-blue-500 text-white hover:bg-blue-600"
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
};

export const DisabledState: Story = {
	render: () => (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						className="pointer-events-none opacity-50"
					/>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" isActive>
						1
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">2</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">3</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
};

export const InteractivePagination: Story = {
	render: () => {
		const [currentPage, setCurrentPage] = React.useState(1);
		const totalPages = 10;

		const handlePageChange = (page: number) => {
			setCurrentPage(page);
		};

		const renderPageLinks = () => {
			const pageLinks = [];
			for (let i = 1; i <= totalPages; i++) {
				if (
					i === 1 ||
					i === totalPages ||
					(i >= currentPage - 1 && i <= currentPage + 1)
				) {
					pageLinks.push(
						<PaginationItem key={i}>
							<PaginationLink
								href="#"
								isActive={currentPage === i}
								onClick={(e) => {
									e.preventDefault();
									handlePageChange(i);
								}}
							>
								{i}
							</PaginationLink>
						</PaginationItem>,
					);
				} else if (i === currentPage - 2 || i === currentPage + 2) {
					pageLinks.push(
						<PaginationItem key={i}>
							<PaginationEllipsis />
						</PaginationItem>,
					);
				}
			}
			return pageLinks;
		};

		return (
			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious
							href="#"
							onClick={(e) => {
								e.preventDefault();
								handlePageChange(Math.max(currentPage - 1, 1));
							}}
							className={
								currentPage === 1 ? "pointer-events-none opacity-50" : ""
							}
						/>
					</PaginationItem>
					{renderPageLinks()}
					<PaginationItem>
						<PaginationNext
							href="#"
							onClick={(e) => {
								e.preventDefault();
								handlePageChange(Math.min(currentPage + 1, totalPages));
							}}
							className={
								currentPage === totalPages
									? "pointer-events-none opacity-50"
									: ""
							}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		);
	},
};

export const CompactPagination: Story = {
	render: () => (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" isActive>
						Page 2 of 10
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
};

export const PaginationWithTotalItems: Story = {
	render: () => {
		const currentPage = 2;
		const itemsPerPage = 10;
		const totalItems = 87;
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		return (
			<div className="flex flex-col items-center space-y-2">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious href="#" />
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#">1</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#" isActive>
								2
							</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#">3</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationEllipsis />
						</PaginationItem>
						<PaginationItem>
							<PaginationLink href="#">{totalPages}</PaginationLink>
						</PaginationItem>
						<PaginationItem>
							<PaginationNext href="#" />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
				<div className="text-gray-500 text-sm">
					Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
					{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
					items
				</div>
			</div>
		);
	},
};

export const ResponsivePagination: Story = {
	render: () => (
		<Pagination>
			<PaginationContent className="flex-wrap justify-center">
				<PaginationItem className="hidden sm:inline-flex">
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem className="sm:hidden">
					<PaginationPrevious href="#" className="h-8 w-8 p-0">
						<span className="sr-only">Previous</span>
					</PaginationPrevious>
				</PaginationItem>
				<PaginationItem className="hidden md:inline-flex">
					<PaginationLink href="#">1</PaginationLink>
				</PaginationItem>
				<PaginationItem className="hidden md:inline-flex">
					<PaginationLink href="#" isActive>
						2
					</PaginationLink>
				</PaginationItem>
				<PaginationItem className="hidden md:inline-flex">
					<PaginationLink href="#">3</PaginationLink>
				</PaginationItem>
				<PaginationItem className="hidden sm:inline-flex md:hidden">
					<PaginationLink href="#" isActive>
						Page 2
					</PaginationLink>
				</PaginationItem>
				<PaginationItem className="md:hidden">
					<PaginationEllipsis />
				</PaginationItem>
				<PaginationItem className="hidden md:inline-flex">
					<PaginationLink href="#">10</PaginationLink>
				</PaginationItem>
				<PaginationItem className="hidden sm:inline-flex">
					<PaginationNext href="#" />
				</PaginationItem>
				<PaginationItem className="sm:hidden">
					<PaginationNext href="#" className="h-8 w-8 p-0">
						<span className="sr-only">Next</span>
					</PaginationNext>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	),
};
