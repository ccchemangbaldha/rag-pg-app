const API_BASE = import.meta.env.VITE_APP_API_URL
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API_BASE}${endpoint}`, {
		headers: { "Content-Type": "application/json" },
		...options,
	});

	if (!response.ok) {
		const errorBody = await response.json().catch(() => ({}));
		throw new Error(errorBody.message || `API Error: ${response.statusText}`);
	}

	const json = await response.json();
	return json.data;
}

export const api = {
	// Users
	getUsers: () => request<any[]>("/users"),
	createUser: (data: any) => request("/users", { method: "POST", body: JSON.stringify(data) }),
	updateUser: (id: number, data: any) => request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
	deleteUser: (id: number) => request(`/users/${id}`, { method: "DELETE" }),

	// Products
	getProducts: () => request<any[]>("/products"),
	createProduct: (data: any) => request("/products", { method: "POST", body: JSON.stringify(data) }),
	updateProduct: (id: number, data: any) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
	deleteProduct: (id: number) => request(`/products/${id}`, { method: "DELETE" }),

	// History
	getUserChats: (userId: number) => request<any[]>(`/history/list/${userId}`), // Get sidebar list
	getChatMessages: (chatId: string) => request<any[]>(`/history/${chatId}`),   // Get specific conversation
	deleteHistory: (historyId: number) => request(`/history/${historyId}`, {
		method: "DELETE"
	}),
	deleteChatSession: (chatId: string) => request(`/history/chat/${chatId}`, {
		method: "DELETE"
	}),

	createHistory: (data: {
		userId: number;
		chatId: string;
		userInput: string;
		botOutput: string;
		summary?: string
		metadata?: string | any;
		sql?: string;
		chartConfig?: string;
	}) => request("/history", {
		method: "POST",
		body: JSON.stringify(data)
	}),

	chatWithAI: (data: { userId: number; chatId: string; prompt: string; summary?: string; imageUrl?: string, history?: any }) =>
		request("/ai/chat", {
			method: "POST",
			body: JSON.stringify(data)
		}),
	login: (data: any) => request("/users/login", { method: "POST", body: JSON.stringify(data) }),
};