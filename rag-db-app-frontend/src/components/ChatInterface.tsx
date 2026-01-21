import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Image as ImageIcon, X } from "lucide-react";
import { api } from "../lib/api";

interface Message {
	id: number;
	role: 'user' | 'bot';
	text: string;
	image?: string;
	summary?: string;
}

export const ChatInterface = ({ user }: { user: any }) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		loadHistory();
	}, []);

	useEffect(() => {
		scrollRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isTyping, selectedImage]);

	const loadHistory = async () => {
		try {
			const history = await api.getUserHistory(user.userId);
			const formatted: Message[] = [];
			const sorted = history.sort((a: any, b: any) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			);

			sorted.forEach((h: any) => {
				formatted.push({ id: h.historyId * 10, role: 'user', text: h.userInput });
				formatted.push({ id: h.historyId * 10 + 1, role: 'bot', text: h.botOutput, summary: h.summary });
			});
			setMessages(formatted);
		} catch (e) {
			console.error("Failed to load chat history");
		}
	};

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setSelectedImage(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() && !selectedImage) return;

		const userText = input;
		const userImage = selectedImage;

		setInput("");
		setSelectedImage(null);
		if (fileInputRef.current) fileInputRef.current.value = "";

		const tempId = Date.now();
		setMessages(prev => [...prev, {
			id: tempId,
			role: 'user',
			text: userText,
			image: userImage || undefined
		}]);

		setIsTyping(true);

		// Inside src/components/ChatInterface.tsx -> handleSend function

		try {
			// 1. Call the real AI Backend
			const response: any = await api.chatWithAI({
				userId: user.userId,
				prompt: userText,     // The text user typed
				imageUrl: userImage as any,  // The image (if any)
				summary: ""           // You can pass previous chat summary here if you have it
			});

			// 2. The AI returns "botOutput" and maybe "products"
			const botResponse = response.botOutput;
			const action = response.action; // "ask_user" or "show_products"
			const foundProducts = response.products;

			// 3. Add Bot Message to UI
			setMessages(prev => [...prev, {
				id: tempId + 1,
				role: 'bot',
				text: botResponse,
				summary: action
			}]);

			// 4. If products were found, you can log them or show them (Optional)
			if (foundProducts && foundProducts.length > 0) {
				console.log("Furniture found:", foundProducts);
				// Later you can make a UI to display these cards
			}

			// 5. Save this conversation to History DB
			await api.createHistory({
				userId: user.userId,
				userInput: userImage ? `[Image] ${userText}` : userText,
				botOutput: botResponse,
				summary: action
			});

		} catch (err) {
			setMessages(prev => [...prev, { id: Date.now(), role: 'bot', text: "Error: AI Service is offline." }]);
		} finally {
			setIsTyping(false);
		}
	};

	return (
		<div className="flex flex-col h-[calc(100vh-80px)] bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden border dark:border-gray-800">

			<div className="p-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center gap-3">
				<div className="bg-gradient-to-tr from-red-500 to-blue-500 p-2 rounded-lg">
					<Sparkles className="text-white w-5 h-5" />
				</div>
				<div>
					<h3 className="font-bold text-gray-800 dark:text-white">AI Assistant</h3>
					<p className="text-xs text-green-500 font-medium flex items-center gap-1">
						<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
					</p>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
				{messages.length === 0 && (
					<div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-50">
						<Bot size={64} strokeWidth={1} />
						<p>Start a conversation...</p>
					</div>
				)}

				{messages.map((msg) => (
					<motion.div
						initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
						key={msg.id}
						className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
					>
						<div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-blue-600 text-white'}`}
						>
							{msg.role === 'user' ? <UserIcon size={20} className="text-gray-600 dark:text-gray-300" /> : <Bot size={20} />}
						</div>

						<div className={`max-w-[80%] space-y-1`}>
							<div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden
                 ${msg.role === 'user'
									? 'bg-blue-600 text-white rounded-tr-none'
									: 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'}`}
							>
								{msg.image && (
									<div className="mb-3 rounded-lg overflow-hidden">
										<img src={msg.image} alt="User upload" className="max-w-full h-auto object-cover" />
									</div>
								)}
								{msg.text}
							</div>
							{msg.role === 'bot' && msg.summary && (
								<div className="text-[10px] text-gray-400 pl-2">Summary: {msg.summary}</div>
							)}
						</div>
					</motion.div>
				))}

				{isTyping && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
						<div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
							<Bot size={20} className="text-white" />
						</div>
						<div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border dark:border-gray-700 flex items-center gap-2">
							<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
							<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
							<span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
						</div>
					</motion.div>
				)}
				<div ref={scrollRef} />
			</div>

			<div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
				{selectedImage && (
					<div className="mb-4 relative w-fit">
						<div className="relative rounded-xl overflow-hidden border dark:border-gray-700 shadow-md">
							<img src={selectedImage} alt="Preview" className="h-20 w-auto object-cover" />
						</div>
						<button
							onClick={() => { setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
							className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
						>
							<X size={12} />
						</button>
					</div>
				)}

				<form onSubmit={handleSend} className="relative max-w-6xl mx-auto flex items-center gap-2">
					<input
						type="file"
						accept="image/*"
						ref={fileInputRef}
						onChange={handleImageSelect}
						className="hidden"
					/>

					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="p-3 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
						title="Upload Image"
					>
						<ImageIcon size={20} />
					</button>

					<input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your message..."
						className="w-full px-5 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
					/>

					<button
						type="submit"
						disabled={(!input.trim() && !selectedImage) || isTyping}
						className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all shadow-lg disabled:shadow-none"
					>
						{isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
					</button>
				</form>
			</div>
		</div>
	);
};