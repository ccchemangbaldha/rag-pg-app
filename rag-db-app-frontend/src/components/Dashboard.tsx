import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Package, Plus, Edit2, Trash2, Star, Tag, FileSpreadsheet, Loader2 } from "lucide-react";
import type { User, Product } from "../types";
import { api } from "../lib/api";
import { Modal } from "./ui/Modal";
import { UserForm } from "./UserForm";
import { ProductForm } from "./ProductForm";
import * as XLSX from "xlsx";

export const Dashboard = () => {
	const [activeTab, setActiveTab] = useState<"users" | "products">("products");
	const [users, setUsers] = useState<User[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	// --- New State for Bulk Upload ---
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [modal, setModal] = useState<{
		isOpen: boolean;
		type: 'user' | 'product' | 'history' | null;
		data?: any
	}>({ isOpen: false, type: null });

	useEffect(() => { loadData(); }, []);

	const loadData = async () => {
		try {
			const [u, p] = await Promise.all([api.getUsers(), api.getProducts()]);
			setUsers(u); setProducts(p);
		} catch (e) { console.error(e); } finally { setLoading(false); }
	};

	// --- Bulk Upload Handler ---
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		const reader = new FileReader();

		reader.onload = async (evt) => {
			try {
				const bstr = evt.target?.result;
				const wb = XLSX.read(bstr, { type: "binary" });
				const wsname = wb.SheetNames[0];
				const ws = wb.Sheets[wsname];

				// Convert to JSON
				const data: any[] = XLSX.utils.sheet_to_json(ws);

				if (data.length === 0) {
					alert("File is empty!");
					setIsUploading(false);
					return;
				}

				setUploadProgress({ current: 0, total: data.length });
				let successCount = 0;
				let failCount = 0;

				// Process One by One
				for (let i = 0; i < data.length; i++) {
					const row = data[i];
					try {
						const productPayload = {
							...row,
							price: Number(row.price || 0),
							mfr_cost: Number(row.mfr_cost || 0),
							rating: Number(row.rating || 0),
							shipping_charge: Number(row.shipping_charge || 0),
							size: row.size ? String(row.size) : undefined,
							product_name: row.product_name || row.productName,
						};

						await api.createProduct(productPayload);
						successCount++;
					} catch (err) {
						console.error(`Row ${i + 1} failed:`, err);
						failCount++;
					}

					// Update Progress
					setUploadProgress({ current: i + 1, total: data.length });
				}

				alert(`Upload Complete!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
				loadData(); // Refresh list

			} catch (error) {
				console.error("File parse error:", error);
				alert("Failed to parse Excel file.");
			} finally {
				setIsUploading(false);
				setUploadProgress({ current: 0, total: 0 });
				if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
			}
		};

		reader.readAsBinaryString(file);
	};

	const handleSaveUser = async (data: any) => {
		if (data.userId) await api.updateUser(data.userId, data);
		else await api.createUser(data);
		loadData(); setModal({ isOpen: false, type: null });
	};

	const handleDeleteUser = async (id: number) => {
		if (!confirm("Delete this user?")) return;
		await api.deleteUser(id);
		loadData();
	};

	const handleSaveProduct = async (data: any) => {
		if (data.product_id) await api.updateProduct(data.product_id, data);
		else await api.createProduct(data);
		loadData(); setModal({ isOpen: false, type: null });
	};

	const handleDeleteProduct = async (id: number) => {
		if (!confirm("Delete this product?")) return;
		await api.deleteProduct(id);
		loadData();
	};

	if (loading) return <div className="text-center py-20 dark:text-white">Loading Systems...</div>;

	return (
		<>
			<div className="flex gap-2 mb-8 border-b dark:border-gray-800 pb-1">
				{[{ id: "products", icon: Package, label: "Products" }, { id: "users", icon: Users, label: "Users" }].map(tab => (
					<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all relative ${activeTab === tab.id ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800/50" : "text-gray-500 hover:text-gray-800 dark:hover:text-white"}`}>
						<tab.icon size={18} /> {tab.label}
						{activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
					</button>
				))}
			</div>

			{/* --- Progress Bar Overlay --- */}
			{isUploading && (
				<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
					<div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-80 text-center">
						<Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-4" />
						<h3 className="text-lg font-bold dark:text-white mb-2">Importing Products...</h3>
						<div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
							<div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
						</div>
						<p className="text-sm text-gray-500">{uploadProgress.current} / {uploadProgress.total} Processed</p>
					</div>
				</div>
			)}

			<AnimatePresence mode="wait">
				{activeTab === "users" ? (
					<motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
						<div className="flex justify-between mb-6 items-center">
							<h2 className="text-2xl font-bold dark:text-white">User Management</h2>
							<button onClick={() => setModal({ isOpen: true, type: 'user', data: {} })} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><Plus size={18} /> Add User</button>
						</div>
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
							{users.map(user => (
								<div key={user.userId} className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
									<div className="flex justify-between mb-4">
										<div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">{user.username?.[0]?.toUpperCase()}</div>
										<div className="flex gap-1">
											<button onClick={() => setModal({ isOpen: true, type: 'user', data: user })} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"><Edit2 size={16} /></button>
											<button onClick={() => handleDeleteUser(user.userId)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={16} /></button>
										</div>
									</div>
									<h3 className="font-bold dark:text-white text-lg">{user.username}</h3>
									<p className="text-gray-500 text-sm mb-1">{user.email}</p>
									<p className="text-xs text-gray-400">UID: {user.userId}</p>
								</div>
							))}
						</div>
					</motion.div>
				) : (
					<motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
						<div className="flex justify-between mb-6 items-center">
							<h2 className="text-2xl font-bold dark:text-white">Product Inventory</h2>
							<div className="flex gap-2">
								{/* Hidden File Input */}
								<input
									type="file"
									accept=".xlsx, .xls"
									ref={fileInputRef}
									className="hidden"
									onChange={handleFileUpload}
								/>

								{/* Upload Button */}
								<button
									onClick={() => fileInputRef.current?.click()}
									disabled={isUploading}
									className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
								>
									<FileSpreadsheet size={18} className="text-emerald-600" /> Import XLSX
								</button>

								<button onClick={() => setModal({ isOpen: true, type: 'product', data: {} })} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"><Plus size={18} /> Add Product</button>
							</div>
						</div>
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{products.map(product => (
								<div key={product.product_id} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
									<div className="flex justify-between items-start mb-3">
										<div>
											<div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{product.brand}</div>
											<h3 className="font-bold text-lg dark:text-white leading-tight">{product.product_name}</h3>
										</div>
										<div className="flex flex-col items-end">
											<span className="text-xl font-bold text-gray-900 dark:text-white">${product.price}</span>
											{product.rating > 0 && (
												<div className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
													<Star size={10} fill="currentColor" /> {product.rating}
												</div>
											)}
										</div>
									</div>
									<div className="flex flex-wrap gap-2 mb-4">
										<span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded flex items-center gap-1">
											<Tag size={12} /> {product.category}
										</span>
										{product.sub_category && (
											<span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
												{product.sub_category}
											</span>
										)}
									</div>
									<p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">
										{product.description || "No description available."}
									</p>
									<div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-800 pt-3 mb-4">
										<div>Color: <span className="text-gray-700 dark:text-gray-300">{product.color || "N/A"}</span></div>
										<div>Size: <span className="text-gray-700 dark:text-gray-300">{product.size || "N/A"}</span></div>
										<div>Origin: <span className="text-gray-700 dark:text-gray-300">{product.country_of_origin || "N/A"}</span></div>
										<div>Launch: <span className="text-gray-700 dark:text-gray-300">{product.launch_year || "N/A"}</span></div>
									</div>
									<div className="flex gap-2 mt-auto">
										<button onClick={() => setModal({ isOpen: true, type: 'product', data: product })} className="flex-1 flex items-center justify-center gap-2 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors font-medium text-sm">
											<Edit2 size={16} /> Edit
										</button>
										<button onClick={() => handleDeleteProduct(product.product_id)} className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded-lg transition-colors">
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<Modal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.type === 'history' ? "Conversation Logs" : "Data Management"}>
				{modal.type === 'user' && <UserForm initialData={modal.data} onSubmit={handleSaveUser} onCancel={() => setModal({ ...modal, isOpen: false })} />}
				{modal.type === 'product' && <ProductForm initialData={modal.data} onSubmit={handleSaveProduct} onCancel={() => setModal({ ...modal, isOpen: false })} />}
			</Modal>
		</>
	);
};