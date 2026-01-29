import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText
} from "lucide-react";

interface DatabaseConfigProps {
  onSave?: (config: DatabaseConfig) => void;
}

interface DatabaseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  sslMode: string;
  sslCert?: string;
  maxConnections: string;
  connectionTimeout: string;
}

export const DatabaseConfig = ({ onSave }: DatabaseConfigProps) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    host: "localhost",
    port: "5432",
    database: "",
    user: "",
    password: "",
    sslMode: "prefer",
    sslCert: "",
    maxConnections: "10",
    connectionTimeout: "30"
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Load config from localStorage (in production, this would come from secure backend)
    const saved = localStorage.getItem("db_config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load config");
      }
    }
  }, []);

  const handleChange = (field: keyof DatabaseConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleSave = () => {
    // In production, this should send to secure backend
    localStorage.setItem("db_config", JSON.stringify(config));
    onSave?.(config);
    setTestResult({
      success: true,
      message: "Configuration saved successfully"
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock test result
    const success = config.host && config.database && config.user;
    setTestResult({
      success,
      message: success
        ? "Connection successful!"
        : "Connection failed. Please check your credentials."
    });
    setIsTesting(false);
  };

  const generateEnvFile = () => {
    const envContent = `# Database Configuration
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_NAME=${config.database}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_DIALECT=postgres
DB_SSL_MODE=${config.sslMode}
${config.sslCert ? `DB_SSL_CERT=${config.sslCert}` : ""}
DB_MAX_CONNECTIONS=${config.maxConnections}
DB_CONNECTION_TIMEOUT=${config.connectionTimeout}
`;

    navigator.clipboard.writeText(envContent);
    setTestResult({
      success: true,
      message: "Environment variables copied to clipboard!"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <Database size={32} />
            <div>
              <h2 className="text-2xl font-bold">Database Configuration</h2>
              <p className="text-blue-100 text-sm mt-1">
                Configure your PostgreSQL database connection settings
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Connection Details */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              Connection Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Host
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => handleChange("host", e.target.value)}
                  placeholder="localhost or IP address"
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Port
                </label>
                <input
                  type="text"
                  value={config.port}
                  onChange={(e) => handleChange("port", e.target.value)}
                  placeholder="5432"
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Database Name
                </label>
                <input
                  type="text"
                  value={config.database}
                  onChange={(e) => handleChange("database", e.target.value)}
                  placeholder="mydb"
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User
                </label>
                <input
                  type="text"
                  value={config.user}
                  onChange={(e) => handleChange("user", e.target.value)}
                  placeholder="postgres"
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={config.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 pr-12 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Advanced Settings */}
          <section>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-600 rounded-full" />
              Advanced Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  SSL Mode
                </label>
                <select
                  value={config.sslMode}
                  onChange={(e) => handleChange("sslMode", e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="disable">Disable</option>
                  <option value="allow">Allow</option>
                  <option value="prefer">Prefer</option>
                  <option value="require">Require</option>
                  <option value="verify-ca">Verify CA</option>
                  <option value="verify-full">Verify Full</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Connections
                </label>
                <input
                  type="number"
                  value={config.maxConnections}
                  onChange={(e) =>
                    handleChange("maxConnections", e.target.value)
                  }
                  placeholder="10"
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={config.connectionTimeout}
                  onChange={(e) =>
                    handleChange("connectionTimeout", e.target.value)
                  }
                  placeholder="30"
                  className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SSL Certificate Path (optional)
              </label>
              <input
                type="text"
                value={config.sslCert}
                onChange={(e) => handleChange("sslCert", e.target.value)}
                placeholder="/path/to/ca-certificate.crt"
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </section>

          {/* Test Result */}
          {testResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg flex items-center gap-3 ${
                testResult.success
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <p className="font-medium">{testResult.message}</p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={18}
                className={isTesting ? "animate-spin" : ""}
              />
              {isTesting ? "Testing..." : "Test Connection"}
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all"
            >
              <Save size={18} />
              Save Configuration
            </button>

            <button
              onClick={generateEnvFile}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-all"
            >
              <Copy size={18} />
              Copy as .env
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-3">
              <FileText
                size={20}
                className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-semibold mb-1">Security Note</p>
                <p>
                  Never commit sensitive credentials to version control. Use
                  environment variables and secure secret management systems in
                  production. The "Copy as .env" button generates the required
                  format for your <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">.env</code> file.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
