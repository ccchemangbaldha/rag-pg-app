import { useState, useMemo } from "react";
import type { Product } from "../types";
import {
	ChevronDown, Star, Tag, Globe, Shield,
	Palette, Ruler, Layers, Truck,
	Info, Calendar, User, DollarSign, PackageSearch
} from "lucide-react";

export const ProductGrid = ({ products }: { products: Product[] }) => {
	const INITIAL_DISPLAY_COUNT = 4;
	const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

	// 1. Filter valid products first to ensure pagination is accurate
	// We strictly filter out items that lack a product name
	const validProducts = useMemo(() => {
		return products.filter(p => p.product_name && p.product_name.trim() !== "");
	}, [products]);

	// 2. Slice the *valid* list, not the raw list
	const visibleProducts = validProducts.slice(0, displayCount);
	const hasMore = validProducts.length > displayCount;
	const remainingCount = validProducts.length - displayCount;
	const nextBatchSize = Math.min(4, remainingCount);

	const handleShowMore = () => {
		setDisplayCount(prev => prev + 4);
	};

	// Helper: Only renders if value is present
	const InfoRow = ({ icon: Icon, label, value, prefix = "", suffix = "" }: { icon?: any, label?: string, value: string | number | undefined | null, prefix?: string, suffix?: string }) => {
		if (value === null || value === undefined || value === "") return null;
		return (
			<div className="flex items-center gap-2 text-xs mb-1.5 last:mb-0">
				{Icon && <Icon size={12} className="text-gray-400 shrink-0" />}
				{label && <span className="text-gray-500 dark:text-gray-400">{label}:</span>}
				<span className="font-medium text-gray-700 dark:text-gray-200 truncate">
					{prefix}{value}{suffix}
				</span>
			</div>
		);
	};

	// 3. Handle Empty State
	if (validProducts.length === 0) {
		return (
			<div className="mt-4 p-8 bg-gray-50 dark:bg-gray-900 border border-dashed dark:border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-400">
				<PackageSearch size={24} className="mb-2 opacity-50" />
				<span className="text-xs font-medium">No displayable products found.</span>
			</div>
		);
	}

	return (
		<div className="mt-4 not-prose">
			{/* GRID OF 2 */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				{visibleProducts.map((product) => {
					// Check availability for conditional section rendering
					const hasPricing = product.price != null || product.mfr_cost != null;
					const hasSpecs = product.color || product.size || product.material || product.gender;
					const hasLogistics = product.country_of_origin || product.warranty_months || product.shipping_charge || product.care_instructions;

					return (
						<div key={product.product_id} className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">

							{/* --- HEADER --- */}
							<div className="flex justify-between items-start mb-3 gap-2">
								<div className="flex flex-col min-w-0">
									<div className="flex flex-wrap items-center gap-2 mb-1">
										{product.brand && (
											<span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider truncate">
												{product.brand}
											</span>
										)}
										{product.launch_year && (
											<span className="text-[10px] text-gray-400 flex items-center gap-1 shrink-0">
												<Calendar size={10} /> {product.launch_year}
											</span>
										)}
									</div>
									<h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug break-words group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
										{product.product_name}
									</h3>
								</div>
								{product.rating != null && product.rating > 0 && (
									<div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-900/30 shrink-0">
										<span className="font-bold text-amber-600 dark:text-amber-500 text-[10px]">{product.rating}</span>
										<Star size={10} className="fill-amber-500 text-amber-500" />
									</div>
								)}
							</div>

							{/* --- DESCRIPTION (Optional) --- */}
							{product.description && (
								<p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
									{product.description}
								</p>
							)}

							<div className="mt-auto space-y-3">

								{/* --- PRICING SECTION --- */}
								{hasPricing && (
									<div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg flex flex-wrap gap-x-4 gap-y-1 items-baseline">
										{product.price != null && (
											<div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
												<DollarSign size={14} className="stroke-[2.5]" />
												<span className="text-lg font-bold">{product.price}</span>
											</div>
										)}
										{product.mfr_cost != null && (
											<div className="text-[10px] text-gray-400">
												<span className="line-through decoration-red-300 decoration-1">Mfr: ${product.mfr_cost}</span>
											</div>
										)}
										{product.shipping_charge != null && (
											<div className="text-[10px] text-gray-500 flex items-center gap-1 ml-auto">
												<Truck size={10} /> +${product.shipping_charge} Ship
											</div>
										)}
									</div>
								)}

								{/* --- SPECS & LOGISTICS GRID --- */}
								{(hasSpecs || hasLogistics) && (
									<div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t dark:border-gray-800">
										{/* Column 1: Physical Specs */}
										{hasSpecs && (
											<div className="flex flex-col">
												<InfoRow icon={Palette} value={product.color} />
												<InfoRow icon={Ruler} value={product.size} prefix="Size: " />
												<InfoRow icon={Layers} value={product.material} />
												<InfoRow icon={User} value={product.gender} />
											</div>
										)}

										{/* Column 2: Logistics/Origin */}
										{hasLogistics && (
											<div className="flex flex-col">
												<InfoRow icon={Globe} value={product.country_of_origin} />
												<InfoRow icon={Shield} value={product.warranty_months} suffix=" mo warranty" />
												{product.care_instructions && (
													<div className="flex items-start gap-1.5 text-xs mt-0.5">
														<Info size={12} className="text-gray-400 shrink-0 mt-0.5" />
														<span className="text-gray-600 dark:text-gray-300 italic line-clamp-2 leading-tight text-[11px]">
															{product.care_instructions}
														</span>
													</div>
												)}
											</div>
										)}
									</div>
								)}

								{/* --- FOOTER TAGS --- */}
								{(product.category || product.sub_category) && (
									<div className="flex flex-wrap gap-1.5 pt-1">
										<InfoRow
											value={product.category}
											icon={Tag}
											prefix=""
											suffix={product.sub_category ? ` / ${product.sub_category}` : ""}
										/>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Pagination Button */}
			{hasMore && (
				<button
					onClick={handleShowMore}
					className="w-full mt-4 py-2.5 text-xs font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 border dark:border-gray-700 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
				>
					Show {nextBatchSize} More <ChevronDown size={14} />
				</button>
			)}
		</div>
	);
};