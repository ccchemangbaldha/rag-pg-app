// components/ProductsTab.tsx
import { useRef } from "react";
import { FileSpreadsheet, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { ProductCard } from "../ProductCard";
import { Pagination } from "../Pagination";
import { usePagination } from "../../hooks/usePagination";
import type { Product } from "../../types";

interface ProductsTabProps {
	products: Product[];
	onAdd: () => void;
	onEdit: (p: Product) => void;
	onDelete: (id: number) => void;
	onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	isUploading: boolean;
}

export const ProductsTab = ({ products, onAdd, onEdit, onDelete, onUpload, isUploading }: ProductsTabProps) => {
	const { currentData, currentPage, maxPage, goToPage } = usePagination(products, 6);
	const fileInputRef = useRef<HTMLInputElement>(null);

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
			<div className="flex flex-col sm:flex-row justify-between mb-6 items-start sm:items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold dark:text-white">Product Inventory</h2>
					<p className="text-sm text-gray-500">Manage your catalogue and pricing</p>
				</div>

				<div className="flex gap-2">
					<input type="file" accept=".xlsx, .xls" ref={fileInputRef} className="hidden" onChange={onUpload} />

					<button
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
						className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
					>
						<FileSpreadsheet size={16} className="text-emerald-600" /> Import
					</button>

					<button onClick={onAdd} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium">
						<Plus size={16} /> Add Product
					</button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{currentData.map(product => (
					<ProductCard key={product.product_id} product={product} onEdit={onEdit} onDelete={onDelete} />
				))}
			</div>

			<Pagination currentPage={currentPage} maxPage={maxPage} onPageChange={goToPage} />
		</motion.div>
	);
};