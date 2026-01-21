interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
}

export const InputGroup = ({ label, className, ...props }: InputGroupProps) => (
	<div className="flex flex-col space-y-1.5 mb-4">
		<label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
			{label}
		</label>
		<input
			className={`px-4 py-2.5 rounded-lg border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 
				focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all 
				text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${className}`}
			{...props}
		/>
	</div>
);