import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sun, Moon } from "lucide-react";
import { InputGroup } from "./ui/InputGroup";
import { api } from "../lib/api";

interface LoginScreenProps {
	onLoginSuccess: (userData: any) => void;
	darkMode: boolean;
	toggleTheme: () => void;
}

export const LoginScreen = ({ onLoginSuccess, darkMode, toggleTheme }: LoginScreenProps) => {
	const [form, setForm] = useState({ username: "", password: "" });
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const res = await api.login(form);
			// "Obfuscate" session data for localStorage
			localStorage.setItem("app_session", btoa(JSON.stringify(res)));
			onLoginSuccess(res);
		} catch (err: any) {
			setError(err.message || "Invalid credentials");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
			<button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-gray-200 dark:bg-gray-800">
				{darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
			</button>

			<motion.div
				initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border dark:border-gray-800"
			>
				<div className="bg-blue-600 p-8 text-center">
					<div className="mx-auto bg-white/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
						<Lock className="text-white w-8 h-8" />
					</div>
					<h2 className="text-2xl font-bold text-white">Welcome Back</h2>
					<p className="text-blue-100">Sign in to access Admin & Chat</p>
				</div>

				<form onSubmit={handleLogin} className="p-8 space-y-4">
					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center">
							{error}
						</div>
					)}

					<InputGroup
						label="Username"
						value={form.username}
						onChange={e => setForm({ ...form, username: e.target.value })}
						placeholder="Enter username"
					/>
					<InputGroup
						label="Password"
						type="password"
						value={form.password}
						onChange={e => setForm({ ...form, password: e.target.value })}
						placeholder="••••••••"
					/>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 mt-4"
					>
						{loading ? "Signing In..." : "Sign In"}
					</button>
				</form>
			</motion.div>
		</div>
	);
};