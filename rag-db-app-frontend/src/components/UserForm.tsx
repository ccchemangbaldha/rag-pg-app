import { useState } from "react";
import type { User } from "../types";
import { InputGroup } from "./ui/InputGroup";
import { Save } from "lucide-react";

interface UserFormProps {
	initialData: Partial<User>;
	onSubmit: (user: Partial<User>) => void;
	onCancel: () => void;
}

export const UserForm = ({ initialData, onSubmit, onCancel }: UserFormProps) => {
	const [formData, setFormData] = useState<Partial<User>>({
		email: "",
		username: "",
		password: "",
		...initialData
	});

	const handleChange = (field: keyof User, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
	};

	return (
		<form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-2">
			<InputGroup
				label="Username"
				value={formData.username}
				onChange={(e) => handleChange("username", e.target.value)}
				placeholder="johndoe"
				required
			/>
			<InputGroup
				label="Email Address"
				type="email"
				value={formData.email}
				onChange={(e) => handleChange("email", e.target.value)}
				placeholder="john@example.com"
				required
			/>
			{!initialData.userId && (
				<InputGroup
					label="Password"
					type="password"
					value={formData.password}
					onChange={(e) => handleChange("password", e.target.value)}
					placeholder="••••••••"
				/>
			)}

			<div className="flex justify-end gap-3 mt-8 pt-4 border-t dark:border-gray-700">
				<button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
					Cancel
				</button>
				<button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5">
					<Save size={18} /> Save User
				</button>
			</div>
		</form>
	);
};