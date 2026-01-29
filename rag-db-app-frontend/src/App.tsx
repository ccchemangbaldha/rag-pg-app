import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Database
} from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { ChatInterface } from "./components/ChatInterface";
import { DatabaseConfig } from "./components/DatabaseConfig";
import { Sidebar } from "./components/Sidebar";
import { api } from "./lib/api";

const STORAGE_KEY = "app_session";

export default function App() {
  const [userSession, setUserSession] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'dashboard' | 'chat' | 'database'>('chat');
  const [chatList, setChatList] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Helper to refresh chat list
  const refreshChatList = () => {
    if (userSession?.userId) {
      api.getUserChats(userSession.userId)
        .then(setChatList)
        .catch(console.error);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUserSession(JSON.parse(atob(stored)));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Fetch Chat History List
  useEffect(() => {
    if (userSession && view === 'chat') {
      refreshChatList();
    }
  }, [userSession, view]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserSession(null);
  };

  const startNewChat = () => {
    setActiveChatId(null);
  };

  // Handle Delete Chat Session
  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Prevent the click from selecting the chat

    if (window.confirm("Are you sure you want to delete this conversation?")) {
      try {
        await api.deleteChatSession(chatId);
        // If the deleted chat was the active one, reset view
        if (activeChatId === chatId) {
          setActiveChatId(null);
        }
        refreshChatList(); // Update sidebar
      } catch (error) {
        alert("Failed to delete chat. Please try again.");
        console.error(error);
      }
    }
  };

  if (!userSession) {
    return <LoginScreen onLoginSuccess={setUserSession} darkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />;
  }

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>

      {/* Navbar */}
      <nav className="h-16 flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setView('chat')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'chat' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <MessageSquare size={16} /> Chat
            </button>
            {userSession.username === 'hemang9705' && (
              <>
                <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'dashboard' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  <LayoutDashboard size={16} /> Admin
                </button>
                <button onClick={() => setView('database')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'database' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  <Database size={16} /> Database
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            {darkMode ? <Sun className="text-amber-400" size={20} /> : <Moon className="text-gray-600" size={20} />}
          </button>
          <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {view === 'chat' && (
          <Sidebar
            chatList={chatList}
            activeChatId={activeChatId}
            onNewChat={startNewChat}
            onSelectChat={setActiveChatId}
            onDeleteChat={handleDeleteChat}
          />
        )}

        <main className="flex-1 relative overflow-y-auto">
          {view === 'chat' ? (
            <ChatInterface
              user={userSession}
              chatId={activeChatId}
              onNewMessage={refreshChatList}
            />
          ) : view === 'dashboard' ? (
            <div className="container mx-auto p-6"><Dashboard /></div>
          ) : (
            <div className="container mx-auto p-6"><DatabaseConfig /></div>
          )}
        </main>
      </div>
    </div>
  );
}
