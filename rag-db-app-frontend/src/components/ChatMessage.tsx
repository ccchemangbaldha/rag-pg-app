import { motion } from "framer-motion";
import { User as UserIcon, Zap, Database, Check, Copy, Sparkles, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProductGrid } from "./productGrid";
import { ChartRenderer } from "./ChartRenderer";
import type { Message } from "../types";

interface ChatMessageProps {
	msg: Message;
	copiedId: string | number | null;
	onCopy: (text: string, id: string | number) => void;
}

const downloadCSV = (data: any[], filename: string) => {
	if (!data || data.length === 0) return;

	// Get headers from the first object
	const headers = Object.keys(data[0]);

	// Convert data to CSV format
	const csvContent = [
		headers.join(','), // Header row
		...data.map(row => headers.map(fieldName =>
			JSON.stringify(row[fieldName], (_, value) => value ?? '') // Handle nulls/formatting
		).join(','))
	].join('\n');

	// Create a blob and trigger download
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.setAttribute('href', url);
	link.setAttribute('download', filename);
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

export const ChatMessage = ({ msg, copiedId, onCopy }: ChatMessageProps) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
		>
			<div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-indigo-600 border-transparent text-white'}`}>
				{msg.role === 'user' ? <UserIcon size={18} /> : <Zap size={18} />}
			</div>

			<div className={`flex flex-col space-y-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
				<div className={`relative group px-5 py-4 rounded-3xl shadow-sm leading-relaxed ${msg.role === 'user'
					? 'bg-indigo-600 text-white rounded-tr-none'
					: 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
					}`}>

					<div className="prose prose-sm dark:prose-invert max-w-none">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								code: ({ children }) => <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-indigo-400 font-mono text-xs">{children}</code>,
								pre: ({ children }) => <pre className="bg-gray-950 text-gray-100 p-4 rounded-xl overflow-x-auto my-3 border border-gray-800 shadow-inner">{children}</pre>,
								table: ({ children }) => <div className="overflow-x-auto my-4"><table className="min-w-full border dark:border-gray-700 divide-y dark:divide-gray-700">{children}</table></div>,
								th: ({ children }) => <th className="px-3 py-2 bg-gray-50 dark:bg-gray-900 text-left text-xs font-bold uppercase">{children}</th>,
								td: ({ children }) => <td className="px-3 py-2 border-t dark:border-gray-700 text-xs">{children}</td>,
							}}
						>
							{msg.text}
						</ReactMarkdown>
					</div>

					{msg.chartConfig && msg.products && (
						<ChartRenderer data={msg.products} config={msg.chartConfig} />
					)}

					{msg.sql && (
						<div className="mt-3 mb-2">
							<div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 pl-1">
								<Database size={12} /> Generated SQL
							</div>
							<div className="bg-gray-900 text-gray-200 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-gray-700 shadow-inner">
								{msg.sql}
							</div>
						</div>
					)}

					{!msg.chartConfig && msg.products && msg.products.length > 0 && (
						<ProductGrid products={msg.products} />
					)}

					{/* 3. Updated Action Buttons Section */}
					<div className={`absolute top-2 ${msg.role === 'user' ? '-left-20' : '-right-20'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
						{/* Only show CSV download if there are products */}
						{msg.products && msg.products.length > 0 && (
							<button
								onClick={() => downloadCSV(msg.products!, `data-${msg.id}.csv`)}
								className="p-2 text-gray-400 hover:text-indigo-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border dark:border-gray-700"
								title="Download CSV"
							>
								<Download size={16} />
							</button>
						)}

						<button
							onClick={() => onCopy(msg.text, msg.id)}
							className="p-2 text-gray-400 hover:text-indigo-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border dark:border-gray-700"
							title="Copy Response"
						>
							{copiedId === msg.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
						</button>
					</div>
				</div>
				{msg.role === 'bot' && msg.summary && <span className="text-[10px] text-gray-400 font-medium px-2 flex items-center gap-1"><Sparkles size={10} /> {msg.summary}</span>}
			</div>
		</motion.div>
	);
};