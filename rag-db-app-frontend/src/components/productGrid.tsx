import { useState } from "react";
import type { Product } from "../types";
import { ChevronDown, ShoppingCart, Star, Tag } from "lucide-react";

export const ProductGrid = ({ products }: { products: Product[] }) => {
	const INITIAL_DISPLAY_COUNT = 4;
	const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

	const visibleProducts = products.slice(0, displayCount);
	const hasMore = products.length > displayCount;

	const handleShowMore = () => {
		setDisplayCount(prev => Math.min(prev + 4, products.length));
	};

	return (
		<div className="mt-4 not-prose">
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{visibleProducts.map((product) => (
					<div key={product.product_id} className="bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow group">

						{/* 1. Conditional Image Section */}
						{
							// Fallback header if image is missing (so Price/Rating aren't lost)
							<div className="px-3 pt-3 flex justify-between items-start">
								<span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
									${product.price}
								</span>
								{product.rating > 0 && (
									<span className="text-amber-500 text-[10px] font-bold flex items-center gap-0.5">
										<Star size={10} fill="currentColor" /> {product.rating}
									</span>
								)}
							</div>
						}

						{/* Product Details */}
						<div className="p-3 flex flex-col flex-1">
							<div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">
								{product.brand}
							</div>
							<h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate mb-1" title={product.product_name}>
								{product.product_name}
							</h4>

							<div className="flex items-center gap-2 mb-2">
								<span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded flex items-center gap-1">
									<Tag size={10} /> {product.category}
								</span>
							</div>

							<button className="mt-auto w-full py-1.5 flex items-center justify-center gap-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium transition-colors">
								<ShoppingCart size={12} /> View Details
							</button>
						</div>
					</div>
				))}
			</div>

			{/* 2. Pagination Button */}
			{hasMore && (
				<button
					onClick={handleShowMore}
					className="w-full mt-3 py-2 text-xs font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-1"
				>
					Show {Math.min(4, products.length - displayCount)} More <ChevronDown size={12} />
				</button>
			)}
		</div>
	);
};