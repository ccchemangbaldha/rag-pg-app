import {
	BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface SeriesConfig {
	dataKey: string;
	name: string;
	color?: string;
}

interface ChartConfig {
	type: 'bar' | 'line' | 'pie' | 'area';
	xAxisKey?: string;           // optional for pie
	series?: SeriesConfig[];
	title?: string;
}

interface ChartRendererProps {
	data: any[];
	config: ChartConfig;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];


/**
 * Utility: validate chart config
 */
function validateChartConfig(config: ChartConfig, data: any[]) {
	if (!config) {
		return { valid: false, reason: "no-config" };
	}

	if (!data || !Array.isArray(data) || data.length === 0) {
		return { valid: false, reason: "no-data" };
	}

	if (!config.type) {
		return { valid: false, reason: "no-type" };
	}

	// Series validation (required for all except maybe pie)
	if (!config.series || !Array.isArray(config.series) || config.series.length === 0) {
		if (config.type === 'pie') {
			return { valid: false, reason: "pie-no-series" };
		}
		return { valid: false, reason: "series-missing" };
	}

	// Pie validations
	if (config.type === 'pie') {
		if (config.series.length !== 1) {
			return { valid: false, reason: "pie-multi-series" };
		}
	}

	// xAxisKey required for all except pie
	if (config.type !== 'pie' && !config.xAxisKey) {
		return { valid: false, reason: "missing-xAxisKey" };
	}

	return { valid: true };
}


/**
 * Utility fallback renderer
 */
const FallbackBox = ({ reason }: { reason: string }) => (
	<div className="w-full bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 shadow-sm mt-4 text-xs text-gray-500 dark:text-gray-400">
		<p className="italic">Cannot render chart ({reason}).</p>
	</div>
);


export const ChartRenderer = ({ data, config }: ChartRendererProps) => {
	const validation = validateChartConfig(config, data);

	// AUTO-HEAL FOR PIE → BAR swap
	if (!validation.valid && validation.reason === "pie-multi-series") {
		console.warn("Pie chart cannot have multiple series. Auto-converting to bar.");
		config = { ...config, type: "bar" };
	}

	// Revalidate after auto-heal
	const postValidation = validateChartConfig(config, data);
	if (!postValidation.valid) {
		console.warn("ChartRenderer invalid config:", { config, reason: postValidation.reason });
		return <FallbackBox reason={postValidation.reason as string} />;
	}

	const renderChart = () => {
		switch (config.type) {
			case 'line':
				return (
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
						<XAxis dataKey={config.xAxisKey} className="text-xs" />
						<YAxis className="text-xs" />
						<Tooltip />
						<Legend />
						{config.series!.map((s, i) => (
							<Line
								key={s.dataKey}
								type="monotone"
								dataKey={s.dataKey}
								name={s.name}
								stroke={s.color || COLORS[i % COLORS.length]}
								strokeWidth={2}
							/>
						))}
					</LineChart>
				);

			case 'area':
				return (
					<AreaChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey={config.xAxisKey} />
						<YAxis />
						<Tooltip />
						<Legend />
						{config.series!.map((s, i) => (
							<Area
								key={s.dataKey}
								type="monotone"
								dataKey={s.dataKey}
								name={s.name}
								stroke={s.color || COLORS[i % COLORS.length]}
								fill={s.color || COLORS[i % COLORS.length]}
								fillOpacity={0.3}
							/>
						))}
					</AreaChart>
				);

			case 'pie':
				const pieSeries = config.series![0];
				return (
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius={60}
							outerRadius={80}
							paddingAngle={5}
							dataKey={pieSeries.dataKey}
							nameKey={config.xAxisKey || pieSeries.name}
						>
							{data.map((_: any, index: number) => (
								<Cell key={index} fill={COLORS[index % COLORS.length]} />
							))}
						</Pie>
						<Tooltip />
						<Legend />
					</PieChart>
				);

			case 'bar':
			default:
				return (
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey={config.xAxisKey} />
						<YAxis />
						<Tooltip />
						<Legend />
						{config.series!.map((s, i) => (
							<Bar
								key={s.dataKey}
								dataKey={s.dataKey}
								name={s.name}
								fill={s.color || COLORS[i % COLORS.length]}
								radius={[4, 4, 0, 0]}
							/>
						))}
					</BarChart>
				);
		}
	};

	return (
		<div className="w-full bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 shadow-sm mt-4">
			{config.title && (
				<h4 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
					{config.title}
				</h4>
			)}
			<div className="h-[300px] w-full text-xs">
				<ResponsiveContainer width="100%" height="100%">
					{renderChart()}
				</ResponsiveContainer>
			</div>
		</div>
	);
};