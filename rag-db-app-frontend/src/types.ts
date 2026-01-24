export interface User {
	userId: number;
	email: string;
	username: string;
	password?: string;
	createdAt?: string;
}

export interface Product {
	productId: number;
	productName: string;
	category: string;
	style?: string;
	color?: string;
	material?: string;
	price: number;
	// Dimensions are now flattened and match the DB columns exactly
	widthCm?: number;
	depthCm?: number;
	heightCm?: number;
	stock: number;
	imageUrl?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface HistoryLog {
	historyId: number;
	userId: number;
	chatId: string | number;
	userInput: string;
	botOutput: string;
	summary: string;
	metadata: any;
	createdAt: string;
}