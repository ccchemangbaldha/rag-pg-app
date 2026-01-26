// hooks/usePagination.ts
import { useState, useMemo } from "react";

export function usePagination<T>(data: T[], itemsPerPage = 9) {
	const [currentPage, setCurrentPage] = useState(1);

	const maxPage = Math.ceil(data.length / itemsPerPage);

	const currentData = useMemo(() => {
		const begin = (currentPage - 1) * itemsPerPage;
		const end = begin + itemsPerPage;
		return data.slice(begin, end);
	}, [currentPage, data, itemsPerPage]);

	const goToPage = (page: number) => {
		const pageNumber = Math.max(1, Math.min(page, maxPage));
		setCurrentPage(pageNumber);
	};

	return { currentPage, maxPage, currentData, goToPage };
}