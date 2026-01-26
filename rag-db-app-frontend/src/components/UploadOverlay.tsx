// components/UploadOverlay.tsx
import { Loader2 } from "lucide-react";

export const UploadOverlay = ({ progress, total }: { progress: number; total: number }) => (
	<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
		<div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-96 text-center border dark:border-gray-800">
			<Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-6" />
			<h3 className="text-xl font-bold dark:text-white mb-2">Importing Inventory</h3>
			<div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-800 mb-3 overflow-hidden">
				<div
					className="bg-emerald-500 h-full transition-all duration-300 ease-out"
					style={{ width: `${(progress / total) * 100}%` }}
				/>
			</div>
			<p className="text-sm text-gray-500 font-mono">{progress} / {total} processed</p>
		</div>
	</div>
);