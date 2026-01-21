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
	style: string;
	color: string;
	material: string;
	price: number;
	brand: string;
	dimensions: { width: number; height: number };
	stock: number;
	imageUrl?: string; // Made optional
}

export interface HistoryLog {
	historyId: number;
	userId: number;
	userInput: string;
	botOutput: string;
	summary: string;
	createdAt: string;
}