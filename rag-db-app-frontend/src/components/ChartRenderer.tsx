import {
	BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface ChartConfig {
	type: 'bar' | 'line' | 'pie' | 'area';
	xAxisKey: string;
	series: { dataKey: string; name: string; color?: string }[];
	title?: string;
}

interface ChartRendererProps {
	data: any[];
	config: ChartConfig;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ChartRenderer = ({ data, config }: ChartRendererProps) => {
	if (!data || data.length === 0) return null;

	const renderChart = () => {
		switch (config.type) {
			case 'line':
				return (
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
						<XAxis dataKey={config.xAxisKey} className="text-xs" />
						<YAxis className="text-xs" />
						<Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
						<Legend />
						{config.series.map((s, i) => (
							<Line key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color || COLORS[i % COLORS.length]} strokeWidth={2} />
						))}
					</LineChart>
				);
			case 'pie':
				return (
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={60}
							outerRadius={80}
							paddingAngle={5}
							dataKey={config.series[0].dataKey}
							nameKey={config.xAxisKey}
						>
							{data.map((_, index) => (
								<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
							))}
						</Pie>
						<Tooltip />
						<Legend />
					</PieChart>
				);
			case 'area':
				return (
					<AreaChart data={data}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
						<XAxis dataKey={config.xAxisKey} className="text-xs" />
						<YAxis className="text-xs" />
						<Tooltip />
						<Legend />
						{config.series.map((s, i) => (
							<Area key={s.dataKey} type="monotone" dataKey={s.dataKey} name={s.name} stroke={s.color || COLORS[i % COLORS.length]} fill={s.color || COLORS[i % COLORS.length]} fillOpacity={0.3} />
						))}
					</AreaChart>
				);
			case 'bar':
			default:
				return (
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
						<XAxis dataKey={config.xAxisKey} className="text-xs" />
						<YAxis className="text-xs" />
						<Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
						<Legend />
						{config?.series?.map((s, i) => (
							<Bar key={s.dataKey} dataKey={s.dataKey} name={s.name} fill={s.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
						))}
					</BarChart>
				);
		}
	};

	return (
		<div className="w-full bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 shadow-sm mt-4">
			{config.title && <h4 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">{config.title}</h4>}
			<div className="h-[300px] w-full text-xs">
				<ResponsiveContainer width="100%" height="100%">
					{renderChart()}
				</ResponsiveContainer>
			</div>
		</div>
	);
};