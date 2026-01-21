import { useState } from "react";
import type { Product } from "../types";
import { InputGroup } from "./ui/InputGroup";
import { Save, Link as LinkIcon } from "lucide-react";

interface ProductFormProps {
	initialData: Partial<Product>;
	onSubmit: (product: Partial<Product>) => void;
	onCancel: () => void;
}

export const ProductForm = ({ initialData, onSubmit, onCancel }: ProductFormProps) => {
	const [formData, setFormData] = useState<Partial<Product>>({
		productName: "", category: "", price: 0, stock: 0, brand: "",
		style: "", color: "", material: "", dimensions: { width: 0, height: 0 },
		imageUrl: "",
		...initialData
	});

	const handleChange = (field: keyof Product, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	const handleDimChange = (dim: 'width' | 'height', value: string) => {
		setFormData(prev => ({
			...prev,
			dimensions: { ...prev.dimensions!, [dim]: Number(value) }
		}));
	};

	return (
		<form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
			{/* Image URL Input - Full Width */}
			<div className="mb-4">
				<div className="relative">
					<InputGroup
						label="Image URL (Optional)"
						value={formData.imageUrl || ""}
						onChange={e => handleChange("imageUrl", e.target.value)}
						placeholder="https://example.com/image.jpg"
						className="pl-10" // Make room for icon
					/>
					<LinkIcon className="absolute left-3 top-[38px] text-gray-400 dark:text-gray-500" size={16} />
				</div>
				{/* Preview tiny thumbnail if URL exists */}
				{formData.imageUrl && (
					<div className="mt-[-10px] mb-4 text-xs text-blue-500 flex items-center gap-1">
						✓ Image preview active
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
				<InputGroup label="Product Name" value={formData.productName} onChange={e => handleChange("productName", e.target.value)} required />
				<InputGroup label="Category" value={formData.category} onChange={e => handleChange("category", e.target.value)} required />
				<InputGroup label="Brand" value={formData.brand} onChange={e => handleChange("brand", e.target.value)} />
				<InputGroup label="Price ($)" type="number" step="0.01" value={formData.price} onChange={e => handleChange("price", Number(e.target.value))} />
				<InputGroup label="Stock Qty" type="number" value={formData.stock} onChange={e => handleChange("stock", Number(e.target.value))} />
				<InputGroup label="Color" value={formData.color} onChange={e => handleChange("color", e.target.value)} />
			</div>

			<div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-4 border dark:border-gray-700">
				<h4 className="text-sm font-semibold mb-3 dark:text-gray-300">Dimensions (cm)</h4>
				<div className="flex gap-4">
					<InputGroup label="Width" type="number" value={formData.dimensions?.width} onChange={e => handleDimChange('width', e.target.value)} className="bg-white dark:bg-gray-800" />
					<InputGroup label="Height" type="number" value={formData.dimensions?.height} onChange={e => handleDimChange('height', e.target.value)} className="bg-white dark:bg-gray-800" />
				</div>
			</div>

			<div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
				<button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">Cancel</button>
				<button type="submit" className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all">
					<Save size={18} /> Save Product
				</button>
			</div>
		</form>
	);
};