import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Image as ImageIcon, X, Zap, Copy, Check } from "lucide-react";
import { api } from "../lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
	id: string | number;
	role: 'user' | 'bot';
	text: string;
	image?: string;
	summary?: string;
}

export const ChatInterface = ({ user, chatId, onNewMessage }: { user: any, chatId: string | null, onNewMessage: () => void }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | number | null>(null);

	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (chatId) loadChatMessages(chatId);
		else setMessages([]);
	}, [chatId]);

	useEffect(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isTyping]);

	const loadChatMessages = async (id: string) => {
		try {
			const history = await api.getChatMessages(id);
			const formatted: Message[] = [];
			const sorted = history.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

			sorted.forEach((h: any) => {
				formatted.push({ id: `u-${h.historyId}`, role: 'user', text: h.userInput });
				formatted.push({ id: `b-${h.historyId}`, role: 'bot', text: h.botOutput, summary: h.summary });
			});
			setMessages(formatted);
		} catch (e) { console.error("History sync failed"); }
	};

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() && !selectedImage) return;

		const userText = input;
		const userImage = selectedImage;
		const currentChatId = chatId || `chat-${Date.now()}`;
		const isNewChat = !chatId;

		setInput("");
		setSelectedImage(null);

		const tempId = Date.now().toString();
		setMessages(prev => [...prev, { id: tempId, role: 'user', text: userText, image: userImage || undefined }]);
		setIsTyping(true);

		try {
			const response: any = await api.chatWithAI({
				userId: user.userId,
				chatId: currentChatId,
				prompt: userText,
				imageUrl: userImage as any,
				summary: messages.length > 0 ? messages[messages.length - 1].summary : ""
			});

			setMessages(prev => [...prev, { id: tempId + "_bot", role: 'bot', text: response.botOutput, summary: response.action }]);

			await api.createHistory({
				userId: user.userId,
				chatId: currentChatId,
				userInput: userImage ? `[Image] ${userText}` : userText,
				botOutput: response.botOutput,
				summary: response.action
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
			{/* Header */}
			{/* <div className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
						<Sparkles className="text-white w-5 h-5" />
					</div>
					<div>
						<h2 className="font-bold text-gray-900 dark:text-white tracking-tight">VocalAI Assistant</h2>
					</div>
				</div>
			</div> */}

			{/* Chat Body */}
			<div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 no-scrollbar">
				<AnimatePresence initial={false}>
					{messages.length === 0 ? (
						<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center space-y-6">
							<div className="relative">
								<div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
								<Bot size={80} className="relative text-indigo-500 dark:text-indigo-400 opacity-80" strokeWidth={1.5} />
							</div>
							<div className="space-y-2">
								<h3 className="text-2xl font-bold dark:text-white">Namaste, {user.username}</h3>
								<p className="text-gray-500 dark:text-gray-400 max-w-sm">I can help you translate, summarize, or chat in 11 Indian languages. What's on your mind?</p>
							</div>
						</motion.div>
					) : (
						messages.map((msg) => (
							<motion.div
								key={msg.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
							>
								{/* Avatar */}
								<div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-indigo-600 border-transparent text-white'}`}>
									{msg.role === 'user' ? <UserIcon size={18} /> : <Zap size={18} />}
								</div>

								{/* Content */}
								<div className={`flex flex-col space-y-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
									<div className={`relative group px-5 py-4 rounded-3xl shadow-sm leading-relaxed ${msg.role === 'user'
											? 'bg-indigo-600 text-white rounded-tr-none'
											: 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
										}`}>
										{msg.image && <img src={msg.image} className="rounded-xl mb-4 border dark:border-gray-700 max-h-64 object-contain bg-black" />}

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

										{/* Copy Button */}
										<button
											onClick={() => copyToClipboard(msg.text, msg.id)}
											className={`absolute top-2 ${msg.role === 'user' ? '-left-10' : '-right-10'} p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-indigo-500`}
										>
											{copiedId === msg.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
										</button>
									</div>
									{msg.role === 'bot' && msg.summary && <span className="text-[10px] text-gray-400 font-medium px-2 flex items-center gap-1"><Sparkles size={10} /> {msg.summary}</span>}
								</div>
							</motion.div>
						))
					)}
				</AnimatePresence>

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

			{/* Input Form */}
			<div className="px-6 py-6">
				<div className="relative max-w-4xl mx-auto">
					{selectedImage && (
						<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute bottom-full mb-4 left-0">
							<div className="relative group">
								<img src={selectedImage} className="h-32 w-32 object-cover rounded-2xl border-2 border-indigo-500 shadow-2xl bg-black" />
								<button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform">
									<X size={14} />
								</button>
							</div>
						</motion.div>
					)}

					<form onSubmit={handleSend} className="relative flex items-center group">
						<input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) {
								const reader = new FileReader();
								reader.onloadend = () => setSelectedImage(reader.result as string);
								reader.readAsDataURL(file);
							}
						}} className="hidden" />

						<div className="flex-1 relative flex items-center bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl transition-all group-focus-within:border-indigo-500/50 group-focus-within:shadow-2xl group-focus-within:shadow-indigo-500/10 px-2">
							<button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-indigo-500 transition-colors">
								<ImageIcon size={22} />
							</button>

							<input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Message Assistant in Hindi, Bengali..."
								className="flex-1 bg-transparent py-4 px-2 outline-none dark:text-white placeholder:text-gray-400 text-sm"
							/>

							<button
								type="submit"
								disabled={(!input.trim() && !selectedImage) || isTyping}
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