export interface User {
	userId: number;
	email: string;
	username: string;
	password?: string;
	createdAt?: string;
}

export interface ChartConfig {
	type: 'bar' | 'line' | 'pie' | 'area';
	xAxisKey: string;
	series: { dataKey: string; name: string; color?: string }[];
	title?: string;
}

export interface TokenUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

export interface MessageSection {
	text: string;
	sql?: string;
	products?: Product[] | any[];
	chartConfig?: ChartConfig;
	error?: string;
}

export interface Message {
	id: string | number;
	role: 'user' | 'bot';
	text: string;
	image?: string;
	summary?: string;
	products?: Product[];
	sql?: string;
	chartConfig?: ChartConfig;
	sections?: MessageSection[];

	usage?: TokenUsage;
}

export interface Product {
	product_id: number;
	product_name: string;
	brand: string;
	category: string;
	sub_category: string;
	description: string;
	color: string;
	size: string;
	material: string;
	gender: string;
	mfr_cost: number;
	shipping_charge: number;
	price: number;
	country_of_origin: string;
	care_instructions: string;
	warranty_months: number;
	rating: number;
	launch_year: number;
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