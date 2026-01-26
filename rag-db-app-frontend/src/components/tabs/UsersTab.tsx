// components/UsersTab.tsx
import { Plus, Edit2, Trash2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Pagination } from "../Pagination";
import { usePagination } from "../../hooks/usePagination";
import type { User } from "../../types";

interface UsersTabProps {
	users: User[];
	onAdd: () => void;
	onEdit: (u: User) => void;
	onDelete: (id: number) => void;
}

export const UsersTab = ({ users, onAdd, onEdit, onDelete }: UsersTabProps) => {
	const { currentData, currentPage, maxPage, goToPage } = usePagination(users, 8);

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
			<div className="flex justify-between mb-6 items-center">
				<div>
					<h2 className="text-2xl font-bold dark:text-white">User Management</h2>
					<p className="text-sm text-gray-500">Administer accounts and permissions</p>
				</div>
				<button onClick={onAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
					<Plus size={16} /> Add User
				</button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{currentData.map((user:User) => (
					<div key={user.userId} className="bg-white dark:bg-gray-900 border dark:border-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
						<div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
							<button onClick={() => onEdit(user)} className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 text-blue-600 rounded"><Edit2 size={14} /></button>
							<button onClick={() => onDelete(user.userId)} className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button>
						</div>

						<div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-lg mb-3 shadow-blue-500/20 shadow-lg">
							{user.username?.[0]?.toUpperCase()}
						</div>

						<h3 className="font-bold dark:text-white text-lg truncate pr-10">{user.username}</h3>
						<div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
							<Mail size={12} /> {user.email}
						</div>
						<div className="mt-4 pt-3 border-t dark:border-gray-800 flex justify-between items-center">
							<span className="text-[10px] uppercase font-bold text-gray-400">ID: {user.userId}</span>
							<span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Active</span>
						</div>
					</div>
				))}
			</div>

			<Pagination currentPage={currentPage} maxPage={maxPage} onPageChange={goToPage} />
		</motion.div>
	);
};