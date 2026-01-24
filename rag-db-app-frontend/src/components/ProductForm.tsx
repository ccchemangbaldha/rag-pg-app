import { useState } from "react";
import type { Product } from "../types";
import { InputGroup } from "./ui/InputGroup";
import { Save } from "lucide-react";

interface ProductFormProps {
	initialData: Partial<Product>;
	onSubmit: (product: Partial<Product>) => void;
	onCancel: () => void;
}

export const ProductForm = ({ initialData, onSubmit, onCancel }: ProductFormProps) => {
	// Initialize form with new schema default values
	const [formData, setFormData] = useState<Partial<Product>>({
		product_name: "",
		brand: "",
		category: "",
		sub_category: "",
		description: "",
		color: "",
		size: "",
		material: "",
		gender: "",
		mfr_cost: 0,
		shipping_charge: 0,
		price: 0,
		country_of_origin: "",
		care_instructions: "",
		warranty_months: 0,
		rating: 0,
		launch_year: new Date().getFullYear(),
		...initialData
	});

	const handleChange = (field: keyof Product, value: any) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	return (
		<form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>

			{/* --- Basic Info Section --- */}
			<h4 className="text-sm font-semibold mb-3 mt-2 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Basic Details</h4>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mb-4">
				<InputGroup label="Product Name" value={formData.product_name} onChange={e => handleChange("product_name", e.target.value)} required />
				<InputGroup label="Brand" value={formData.brand} onChange={e => handleChange("brand", e.target.value)} required />
				<InputGroup label="Category" value={formData.category} onChange={e => handleChange("category", e.target.value)} required />
				<InputGroup label="Sub Category" value={formData.sub_category} onChange={e => handleChange("sub_category", e.target.value)} />
			</div>

			{/* --- Description Full Width --- */}
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
				<textarea
					className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px]"
					value={formData.description || ""}
					onChange={e => handleChange("description", e.target.value)}
				/>
			</div>

			{/* --- Attributes Section --- */}
			<h4 className="text-sm font-semibold mb-3 mt-6 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Attributes</h4>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 mb-4">
				<InputGroup label="Color" value={formData.color} onChange={e => handleChange("color", e.target.value)} />
				<InputGroup label="Size" value={formData.size} onChange={e => handleChange("size", e.target.value)} />
				<InputGroup label="Material" value={formData.material} onChange={e => handleChange("material", e.target.value)} />
				<InputGroup label="Gender" value={formData.gender} onChange={e => handleChange("gender", e.target.value)} />
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 mb-4">
				<InputGroup label="Origin Country" value={formData.country_of_origin} onChange={e => handleChange("country_of_origin", e.target.value)} />
				<InputGroup label="Care Instructions" value={formData.care_instructions} onChange={e => handleChange("care_instructions", e.target.value)} />
				<InputGroup label="Launch Year" type="number" value={formData.launch_year} onChange={e => handleChange("launch_year", Number(e.target.value))} />
			</div>

			{/* --- Financials & Stats Section --- */}
			<div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-4 border dark:border-gray-700 mt-6">
				<h4 className="text-sm font-semibold mb-3 dark:text-gray-300">Financials & Metrics</h4>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<InputGroup
						label="Mfr Cost"
						type="number" step="0.01"
						value={formData.mfr_cost}
						onChange={e => handleChange('mfr_cost', Number(e.target.value))}
						className="bg-white dark:bg-gray-800"
					/>
					<InputGroup
						label="Shipping ($)"
						type="number" step="0.01"
						value={formData.shipping_charge}
						onChange={e => handleChange('shipping_charge', Number(e.target.value))}
						className="bg-white dark:bg-gray-800"
					/>
					<InputGroup
						label="Price ($)"
						type="number" step="0.01"
						value={formData.price}
						onChange={e => handleChange('price', Number(e.target.value))}
						className="bg-white dark:bg-gray-800 font-bold text-emerald-600"
					/>
					<InputGroup
						label="Warranty (Mos)"
						type="number"
						value={formData.warranty_months}
						onChange={e => handleChange('warranty_months', Number(e.target.value))}
						className="bg-white dark:bg-gray-800"
					/>
					<InputGroup
						label="Rating (0-5)"
						type="number" step="0.1" max="5"
						value={formData.rating}
						onChange={e => handleChange('rating', Number(e.target.value))}
						className="bg-white dark:bg-gray-800"
					/>
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