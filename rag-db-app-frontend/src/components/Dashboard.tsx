import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Package, Plus, Edit2, Trash2, History } from "lucide-react";
import type { User, Product, HistoryLog } from "../types";
import { api } from "../lib/api";
import { Modal } from "./ui/Modal";
import { UserForm } from "./UserForm";
import { ProductForm } from "./ProductForm";
import { HistoryViewer } from "./HistoryViewer";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=400&auto=format&fit=crop";

export const Dashboard = () => {
	const [activeTab, setActiveTab] = useState<"users" | "products">("products");
	const [users, setUsers] = useState<User[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedHistory, setSelectedHistory] = useState<HistoryLog[]>([]);

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
		if (data.productId) await api.updateProduct(data.productId, data);
		else await api.createProduct(data);
		loadData(); setModal({ isOpen: false, type: null });
	};

	const handleDeleteProduct = async (id: number) => {
		if (!confirm("Delete this product?")) return;
		await api.deleteProduct(id);
		loadData();
	};

	const handleViewHistory = async (uid: number) => {
		setModal({ isOpen: true, type: 'history', data: uid });
		// Corrected to use the function defined in your api.ts
		const history = await api.getUserChats(uid);
		setSelectedHistory(history);
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
											<button onClick={() => handleViewHistory(user.userId)} className="p-2 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition-colors" title="View History"><History size={16} /></button>
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
							<button onClick={() => setModal({ isOpen: true, type: 'product', data: {} })} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"><Plus size={18} /> Add Product</button>
						</div>
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{products.map(product => (
								<div key={product.productId} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col group">
									<div className="h-44 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
										<img src={product.imageUrl || FALLBACK_IMAGE} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e: any) => e.target.src = FALLBACK_IMAGE} />
									</div>
									<div className="p-4 flex-1 flex flex-col">
										<div className="flex justify-between mb-2 items-start">
											<h3 className="font-bold dark:text-white group-hover:text-blue-600 transition-colors">{product.productName}</h3>
											<span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm">${product.price}</span>
										</div>
										<div className="mt-auto flex gap-2 pt-4">
											<button onClick={() => setModal({ isOpen: true, type: 'product', data: product })} className="flex-1 flex items-center justify-center gap-2 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg transition-colors"><Edit2 size={16} /> Edit</button>
											<button onClick={() => handleDeleteProduct(product.productId)} className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
										</div>
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
				{modal.type === 'history' && <HistoryViewer logs={selectedHistory} />}
			</Modal>
		</>
	);
};