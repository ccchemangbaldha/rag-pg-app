import { useState, useEffect } from "react";
import { Moon, Sun, LayoutDashboard, MessageSquare, LogOut } from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { ChatInterface } from "./components/ChatInterface";

const STORAGE_KEY = "app_session";

export default function App() {
  const [userSession, setUserSession] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'dashboard' | 'chat'>('chat'); // Default to chat after login
  // 1. Init Session & Theme
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setUserSession(JSON.parse(atob(stored))); } catch (e) { localStorage.removeItem(STORAGE_KEY); }
    }
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserSession(null);
  };

  // 1. SHOW LOGIN SCREEN
  if (!userSession) {
    return <LoginScreen onLoginSuccess={setUserSession} darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />;
  }

  // 2. SHOW MAIN APP
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* View Toggles */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setView('chat')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'chat' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                <MessageSquare size={16} /> Chat
              </button>
              {userSession.username == 'hemang9705' &&
                <button
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'dashboard' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <LayoutDashboard size={16} /> Admin
                </button>
              }
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">Hello, <b className="text-gray-900 dark:text-white">{userSession.username}</b></span>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              {darkMode ? <Sun className="text-amber-400" size={20} /> : <Moon className="text-gray-600" size={20} />}
            </button>
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="container mx-auto px-4 py-6">
        {view === 'chat' ? (
          <ChatInterface user={userSession} />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  );
}