import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Package } from "lucide-react";
import * as XLSX from "xlsx";

import { api } from "../lib/api";
import { Modal } from "./ui/Modal";
import { UserForm } from "./UserForm";
import { ProductForm } from "./ProductForm";
import { UsersTab } from "./tabs/UsersTab";
import { ProductsTab } from "./tabs/ProductsTab";
import { UploadOverlay } from "./UploadOverlay";
import type { User, Product } from "../types";

export const Dashboard = () => {
	const [activeTab, setActiveTab] = useState<"users" | "products">("products");
	const [users, setUsers] = useState<User[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	// Upload State
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

	// Modal State
	const [modal, setModal] = useState<{
		isOpen: boolean;
		type: 'user' | 'product' | null;
		data?: any
	}>({ isOpen: false, type: null });

	// Load Data
	const loadData = useCallback(async () => {
		try {
			const [u, p] = await Promise.all([api.getUsers(), api.getProducts()]);
			setUsers(u);
			setProducts(p);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => { loadData(); }, [loadData]);

	// Handlers (Memoized where appropriate)
	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsUploading(true);
		const reader = new FileReader();

		reader.onload = async (evt) => {
			try {
				const bstr = evt.target?.result;
				const wb = XLSX.read(bstr, { type: "binary" });
				const ws = wb.Sheets[wb.SheetNames[0]];
				const data: any[] = XLSX.utils.sheet_to_json(ws);

				if (!data.length) throw new Error("File empty");

				setUploadProgress({ current: 0, total: data.length });

				// Process in chunks or individually
				for (let i = 0; i < data.length; i++) {
					const row = data[i];
					try {
						await api.createProduct({
							...row,
							price: Number(row.price || 0),
							rating: Number(row.rating || 0),
							product_name: row.product_name || row.productName,
						});
					} catch (err) { console.error(err); }
					setUploadProgress({ current: i + 1, total: data.length });
				}

				await loadData();
				alert("Upload Complete");
			} catch (error) {
				alert("Failed to parse file");
			} finally {
				setIsUploading(false);
				setUploadProgress({ current: 0, total: 0 });
				e.target.value = ""; // Reset input
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
		if (confirm("Delete this user?")) {
			await api.deleteUser(id);
			loadData();
		}
	};

	const handleSaveProduct = async (data: any) => {
		if (data.product_id) await api.updateProduct(data.product_id, data);
		else await api.createProduct(data);
		loadData(); setModal({ isOpen: false, type: null });
	};

	const handleDeleteProduct = async (id: number) => {
		if (confirm("Delete this product?")) {
			await api.deleteProduct(id);
			loadData();
		}
	};

	if (loading) return (
		<div className="flex h-screen items-center justify-center dark:text-white">
			<div className="animate-pulse flex flex-col items-center">
				<Package size={40} className="text-gray-300 mb-4" />
				<p>Initializing System...</p>
			</div>
		</div>
	);

	return (
		<div className="max-w-7xl mx-auto p-6">
			{/* Tabs Header */}
			<nav className="flex gap-1 mb-8 border-b dark:border-gray-800 relative">
				{[
					{ id: "products", icon: Package, label: "Products" },
					{ id: "users", icon: Users, label: "Users" }
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id as any)}
						className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative outline-none ${activeTab === tab.id
								? "text-blue-600 dark:text-blue-400"
								: "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
							}`}
					>
						<tab.icon size={18} /> {tab.label}
						{activeTab === tab.id && (
							<motion.div
								layoutId="activeTab"
								className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
							/>
						)}
					</button>
				))}
			</nav>

			{isUploading && <UploadOverlay progress={uploadProgress.current} total={uploadProgress.total} />}

			<AnimatePresence mode="wait">
				{activeTab === "users" ? (
					<UsersTab
						key="users"
						users={users}
						onAdd={() => setModal({ isOpen: true, type: 'user', data: {} })}
						onEdit={(u) => setModal({ isOpen: true, type: 'user', data: u })}
						onDelete={handleDeleteUser}
					/>
				) : (
					<ProductsTab
						key="products"
						products={products}
						isUploading={isUploading}
						onAdd={() => setModal({ isOpen: true, type: 'product', data: {} })}
						onEdit={(p) => setModal({ isOpen: true, type: 'product', data: p })}
						onDelete={handleDeleteProduct}
						onUpload={handleFileUpload}
					/>
				)}
			</AnimatePresence>

			<Modal
				isOpen={modal.isOpen}
				onClose={() => setModal({ ...modal, isOpen: false })}
				title={modal.type === 'user' ? "User Details" : "Product Details"}
			>
				{modal.type === 'user' && (
					<UserForm
						initialData={modal.data}
						onSubmit={handleSaveUser}
						onCancel={() => setModal({ ...modal, isOpen: false })}
					/>
				)}
				{modal.type === 'product' && (
					<ProductForm
						initialData={modal.data}
						onSubmit={handleSaveProduct}
						onCancel={() => setModal({ ...modal, isOpen: false })}
					/>
				)}
			</Modal>
		</div>
	);
};