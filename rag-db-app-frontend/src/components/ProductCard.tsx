// components/ProductCard.tsx
import { memo } from "react";
import { Edit2, Trash2, Star, Tag } from "lucide-react";
import type { Product } from "../types";

interface ProductCardProps {
	product: Product;
	onEdit: (p: Product) => void;
	onDelete: (id: number) => void;
}

export const ProductCard = memo(({ product, onEdit, onDelete }: ProductCardProps) => (
	<div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-lg hover:border-emerald-500/30 transition-all group flex flex-col h-full">
		<div className="flex justify-between items-start mb-3">
			<div>
				<div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{product.brand}</div>
				<h3 className="font-bold text-lg dark:text-white leading-tight">{product.product_name}</h3>
			</div>
			<div className="flex flex-col items-end">
				<span className="text-xl font-bold text-gray-900 dark:text-white">${product.price}</span>
				{product.rating > 0 && (
					<div className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded mt-1">
						<Star size={10} fill="currentColor" /> {product.rating}
					</div>
				)}
			</div>
		</div>

		<div className="flex flex-wrap gap-2 mb-4">
			<span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md flex items-center gap-1">
				<Tag size={10} /> {product.category}
			</span>
		</div>

		<p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
			{product.description || "No description available."}
		</p>

		<div className="flex gap-2 mt-auto pt-4 border-t dark:border-gray-800/50">
			<button onClick={() => onEdit(product)} className="flex-1 flex items-center justify-center gap-2 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors text-sm font-medium">
				<Edit2 size={14} /> Edit
			</button>
			<button onClick={() => onDelete(product.product_id)} className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded-lg transition-colors">
				<Trash2 size={14} />
			</button>
		</div>
	</div>
));