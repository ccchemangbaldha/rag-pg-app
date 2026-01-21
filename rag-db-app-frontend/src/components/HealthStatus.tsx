import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react";

type HealthResponse = {
	db: string;
	result: number;
};

export default function HealthStatus() {
	const [data, setData] = useState<HealthResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const fetchHealth = async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/health`);
				if (!res.ok) throw new Error("Request failed");
				const json: HealthResponse = await res.json();
				setData(json);
			} catch {
				setError(true);
			} finally {
				setLoading(false);
			}
		};

		fetchHealth();
	}, []);

	const isHealthy = data?.db === "healthy" && data?.result === 1;

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
			<AnimatePresence mode="wait">
				{loading && (
					<motion.div
						key="loading"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0 }}
						className="flex items-center gap-2 rounded-lg bg-white px-6 py-4 shadow-sm"
					>
						<Loader2 className="h-5 w-5 animate-spin text-gray-600" />
						<span className="text-sm font-medium text-gray-600">
							Checking system health...
						</span>
					</motion.div>
				)}

				{!loading && error && (
					<motion.div
						key="error"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="rounded-xl border border-red-200 bg-white p-6 shadow-sm"
					>
						<div className="flex items-center gap-3">
							<XCircle className="h-8 w-8 text-red-600" />
							<div>
								<h2 className="text-lg font-semibold text-gray-900">
									System Unhealthy
								</h2>
								<p className="text-sm text-gray-600">
									Unable to reach backend service
								</p>
							</div>
						</div>
					</motion.div>
				)}

				{!loading && !error && data && (
					<motion.div
						key="success"
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
					>
						<div className="p-6 text-center">
							<motion.div
								initial={{ scale: 0.8 }}
								animate={{ scale: 1 }}
								transition={{ type: "spring", stiffness: 200 }}
								className="mb-4 flex justify-center"
							>
								{isHealthy ? (
									<CheckCircle className="h-12 w-12 text-green-600" />
								) : (
									<XCircle className="h-12 w-12 text-red-600" />
								)}
							</motion.div>

							<h2 className="text-xl font-semibold text-gray-900">
								System Health
							</h2>

							<p className="mt-1 text-sm text-gray-600">
								Backend service status
							</p>

							<div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-gray-50 px-4 py-3">
								<Database className="h-5 w-5 text-gray-600" />
								<span className="text-sm font-medium text-gray-700">
									Database:
								</span>
								<span
									className={`text-sm font-semibold ${isHealthy ? "text-green-600" : "text-red-600"
										}`}
								>
									{data.db}
								</span>
							</div>
						</div>

						<div
							className={`px-6 py-3 text-center text-sm font-medium ${isHealthy
									? "bg-green-50 text-green-700"
									: "bg-red-50 text-red-700"
								}`}
						>
							{isHealthy
								? "All systems operational"
								: "Service requires attention"}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
