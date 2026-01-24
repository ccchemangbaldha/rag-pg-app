import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "../types";

export const ChatInterface = ({ user, chatId, onNewMessage }: { user: any, chatId: string | null, onNewMessage: () => void }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [copiedId, setCopiedId] = useState<string | number | null>(null);

	const scrollRef = useRef<HTMLDivElement>(null);

	// --- Loading & Fetching Logic ---
	useEffect(() => {
		if (!chatId) {
			setMessages([]);
			setIsLoading(false);
			return;
		}

		const fetchHistory = async () => {
			setIsLoading(true);
			try {
				const history = await api.getChatMessages(chatId);
				const sorted = history.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

				const formatted: Message[] = sorted.flatMap((h: any) => [
					{ id: `u-${h.historyId}`, role: 'user', text: h.userInput },
					{
						id: `b-${h.historyId}`,
						role: 'bot',
						text: h.botOutput,
						summary: h.summary,
						products: h.metadata,
						sql: h.sql
					}
				]);

				setMessages(formatted);
			} catch (e) {
				console.error("History sync failed", e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchHistory();
	}, [chatId]);

	// --- Auto Scroll ---
	useEffect(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isTyping, isLoading]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		const userText = input;
		const currentChatId = chatId || `chat-${Date.now()}`;
		const isNewChat = !chatId;

		setInput("");
		const tempId = Date.now().toString();
		setMessages(prev => [...prev, { id: tempId, role: 'user', text: userText }]);
		setIsTyping(true);

		try {
			const response: any = await api.chatWithAI({
				userId: user.userId,
				chatId: currentChatId,
				prompt: userText,
				summary: messages.length > 0 ? messages[messages.length - 1].summary : ""
			});

			setMessages(prev => [...prev, {
				id: tempId + "_bot",
				role: 'bot',
				text: response.botOutput,
				summary: response.action,
				products: response.results,
				sql: response.sql
			}]);

			await api.createHistory({
				userId: user.userId,
				chatId: currentChatId,
				userInput: userText,
				botOutput: response.botOutput,
				summary: response.action,
				metadata: response.results,
				sql: response.sql
			});

			if (isNewChat) onNewMessage();
		} catch (err) {
			setMessages(prev => [...prev, { id: "err", role: 'bot', text: "⚠️ **Connection Error:** Failed to reach AI service." }]);
		} finally { setIsTyping(false); }
	};

	const copyToClipboard = (text: string, id: string | number) => {
		navigator.clipboard.writeText(text);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	return (
		<div className="flex flex-col h-[calc(100vh-60px)] max-w-5xl mx-auto w-full">
			<div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 no-scrollbar">

				{isLoading ? (
					<div className="h-full flex flex-col items-center justify-center text-gray-400">
						<Loader2 size={40} className="animate-spin mb-4 text-indigo-500" />
						<p className="text-sm font-medium animate-pulse">Loading conversation...</p>
					</div>
				) : (
					<AnimatePresence initial={false}>
						{messages.length === 0 ? (
							<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-6">
								<div className="relative">
									<div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
									<Bot size={80} className="relative text-indigo-500 dark:text-indigo-400 opacity-80" strokeWidth={1.5} />
								</div>
								<div className="space-y-2">
									<h3 className="text-2xl font-bold dark:text-white">Namaste, {user.username}</h3>
									<p className="text-gray-500 dark:text-gray-400 max-w-sm">I can analyze your inventory, write SQL, and help you find products. Ask me anything!</p>
								</div>
							</motion.div>
						) : (
							messages.map((msg) => (
								<ChatMessage
									key={msg.id}
									msg={msg}
									copiedId={copiedId}
									onCopy={copyToClipboard}
								/>
							))
						)}
					</AnimatePresence>
				)}

				{isTyping && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
						<div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white"><Loader2 size={18} className="animate-spin" /></div>
						<div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-3xl rounded-tl-none border dark:border-gray-700">
							<div className="flex gap-1.5">
								{[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />)}
							</div>
						</div>
					</motion.div>
				)}
				<div ref={scrollRef} />
			</div>

			<div className="px-6 py-6">
				<div className="relative max-w-4xl mx-auto">
					<form onSubmit={handleSend} className="relative flex items-center group">
						<div className="flex-1 relative flex items-center bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl transition-all group-focus-within:border-indigo-500/50 group-focus-within:shadow-2xl group-focus-within:shadow-indigo-500/10 px-2">
							<input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Ask about products, prices, or SQL..."
								className="flex-1 bg-transparent py-4 px-4 outline-none dark:text-white placeholder:text-gray-400 text-sm"
							/>
							<button
								type="submit"
								disabled={!input.trim() || isTyping}
								className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/30 m-1.5"
							>
								<Send size={20} />
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};