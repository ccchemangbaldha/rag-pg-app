import { motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 20 }}
				className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
			>
				<div className="flex justify-between items-center p-5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
					>
						<X size={20} className="text-gray-500 dark:text-gray-400" />
					</button>
				</div>
				<div className="p-6 overflow-y-auto custom-scrollbar">
					{children}
				</div>
			</motion.div>
		</div>
	);
};