import type { HistoryLog } from "../types";
import { MessageSquare, Bot, User as UserIcon, Calendar } from "lucide-react";

export const HistoryViewer = ({ logs }: { logs: HistoryLog[] }) => {
	if (logs.length === 0) {
		return (
			<div className="text-center py-10 text-gray-500 dark:text-gray-400">
				<MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
				<p>No interaction history found for this user.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{logs.map((log) => (
				<div key={log.historyId} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 pb-6 last:pb-0">
					<div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white dark:ring-gray-800" />

					<div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
						<Calendar size={12} /> {new Date(log.createdAt).toLocaleString()}
					</div>

					<div className="space-y-3">
						<div className="flex gap-3">
							<div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
								<UserIcon size={14} className="text-gray-600 dark:text-gray-300" />
							</div>
							<div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-2xl rounded-tl-none text-sm text-gray-800 dark:text-gray-200">
								{log.userInput}
							</div>
						</div>

						<div className="flex gap-3 flex-row-reverse">
							<div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
								<Bot size={14} className="text-blue-600 dark:text-blue-400" />
							</div>
							<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-3 rounded-2xl rounded-tr-none text-sm text-gray-800 dark:text-gray-200">
								{log.botOutput}
							</div>
						</div>

						<div className="ml-11 mt-2">
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-xs font-medium text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30">
								✨ Summary: {log.summary}
							</span>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};