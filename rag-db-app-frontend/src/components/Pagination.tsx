// components/Pagination.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
	currentPage: number;
	maxPage: number;
	onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, maxPage, onPageChange }: PaginationProps) => {
	if (maxPage <= 1) return null;

	return (
		<div className="flex items-center justify-center gap-4 mt-8">
			<button
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
			>
				<ChevronLeft size={20} />
			</button>
			<span className="text-sm font-medium dark:text-gray-300">
				Page {currentPage} of {maxPage}
			</span>
			<button
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === maxPage}
				className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
			>
				<ChevronRight size={20} />
			</button>
		</div>
	);
};