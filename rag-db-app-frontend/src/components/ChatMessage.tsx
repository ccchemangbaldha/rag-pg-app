import { motion } from "framer-motion";
import { User as UserIcon, Zap, Database, Check, Copy, Sparkles, Download, Cpu, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ProductGrid } from "./productGrid";
import { ChartRenderer } from "./ChartRenderer";
import type { Message, MessageSection } from "../types";

interface ChatMessageProps {
	msg: Message;
	copiedId: string | number | null;
	onCopy: (text: string, id: string | number) => void;
}

const formatSQL = (sql: string) => {
	if (!sql) return "";
	const keywords = [
		"SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY",
		"JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN",
		"LIMIT", "OFFSET", "HAVING", "VALUES", "UPDATE", "SET",
		"DELETE", "INSERT INTO", "CREATE TABLE", "ALTER TABLE", "UNION"
	];

	let formatted = sql;
	keywords.forEach(kw => {
		const regex = new RegExp(`\\b${kw}\\b`, 'gi');
		formatted = formatted.replace(regex, `\n${kw}`);
	});

	formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n  $1');

	return formatted.trim();
};

const downloadCSV = (data: any[], filename: string) => {
	if (!data || data.length === 0) return;
	const headers = Object.keys(data[0]);
	const csvContent = [
		headers.join(','),
		...data.map(row => headers.map(fieldName =>
			JSON.stringify(row[fieldName], (_, value) => value ?? '')
		).join(','))
	].join('\n');
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

interface RenderSectionProps {
	section: MessageSection;
	idx: number;
	msgId: string | number;
	onCopy: (text: string, id: string | number) => void;
	copiedId: string | number | null;
}

const RenderSection = ({ section, idx, msgId, onCopy, copiedId }: RenderSectionProps) => {
	const sqlId = `${msgId}-sql-${idx}`;

	return (
		<div className={`space-y-3 ${idx > 0 ? "pt-4 border-t dark:border-gray-700" : ""}`}>
			{/* Text Response */}
			{section.text && (
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
						{section.text}
					</ReactMarkdown>
				</div>
			)}

			{/* Error Message */}
			{section.error && (
				<div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm">
					<AlertTriangle size={16} />
					{section.error}
				</div>
			)}

			{/* Chart */}
			{section.chartConfig && section.products && (
				<ChartRenderer data={section.products} config={section.chartConfig} />
			)}

			{/* SQL Code with Copy Button */}
			{section.sql && (
				<div className="mt-3 mb-2">
					<div className="flex items-center justify-between mb-1.5 pl-1">
						<div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
							<Database size={12} /> Generated SQL
						</div>
						<button
							onClick={() => onCopy(section.sql!, sqlId)}
							className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-indigo-400 transition-colors"
							title="Copy SQL Query"
						>
							{copiedId === sqlId ? (
								<>
									<Check size={12} className="text-green-500" /> Copied
								</>
							) : (
								<>
									<Copy size={12} /> Copy SQL
								</>
							)}
						</button>
					</div>
					<div className="bg-gray-900 text-gray-200 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-gray-700 shadow-inner whitespace-pre-wrap">
						{formatSQL(section.sql)}
					</div>
				</div>
			)}

			{/* Data Grid */}
			{section.products && section.products.length > 0 && (
				<ProductGrid products={section.products} />
			)}

			{/* Download Button for this section */}
			{section.products && section.products.length > 0 && (
				<div className="flex justify-end">
					<button
						onClick={() => downloadCSV(section.products!, `data-section-${idx}.csv`)}
						className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-500 transition-colors"
					>
						<Download size={14} /> Download CSV
					</button>
				</div>
			)}
		</div>
	);
};

export const ChatMessage = ({ msg, copiedId, onCopy }: ChatMessageProps) => {
	const fullTextToCopy = msg.sections
		? msg.sections.map(s => `${s.text}\n${s.sql || ''}`).join('\n\n')
		: msg.text;

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

					{msg.role === 'user' ? (
						<div className="text-sm">{msg.text}</div>
					) : (
						<div className="flex flex-col gap-6">
							{msg.sections ? (
								msg.sections.map((section, idx) => (
									<RenderSection
										key={idx}
										section={section}
										idx={idx}
										msgId={msg.id}
										onCopy={onCopy}
										copiedId={copiedId}
									/>
								))
							) : (
								<RenderSection
									idx={0}
									section={{
										text: msg.text,
										sql: msg.sql,
										products: msg.products,
										chartConfig: msg.chartConfig
									}}
									msgId={msg.id}
									onCopy={onCopy}
									copiedId={copiedId}
								/>
							)}
						</div>
					)}

					<div className={`absolute top-2 ${msg.role === 'user' ? '-left-10' : '-right-10'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
						<button
							onClick={() => onCopy(fullTextToCopy, msg.id)}
							className="p-2 text-gray-400 hover:text-indigo-500 bg-white dark:bg-gray-800 rounded-full shadow-sm border dark:border-gray-700"
							title="Copy Full Response"
						>
							{copiedId === msg.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
						</button>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3 px-2">
					{msg.role === 'bot' && msg.summary && (
						<span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
							<Sparkles size={10} /> {msg.summary}
						</span>
					)}
					{msg.role === 'bot' && msg.usage && (
						<span className="text-[10px] text-gray-400 font-medium flex items-center gap-1" title="Token Usage">
							<Cpu size={10} />
							In: {msg.usage.prompt_tokens} / Out: {msg.usage.completion_tokens}
						</span>
					)}
				</div>
			</div>
		</motion.div>
	);
};