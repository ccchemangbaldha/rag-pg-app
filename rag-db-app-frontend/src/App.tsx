import { useState, useEffect } from "react";
import {
  Moon,
  Sun,
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Plus,
  MessageCircle,
  Trash2 // Imported Trash icon
} from "lucide-react";
import { LoginScreen } from "./components/LoginScreen";
import { Dashboard } from "./components/Dashboard";
import { ChatInterface } from "./components/ChatInterface";
import { api } from "./lib/api";

const STORAGE_KEY = "app_session";

export default function App() {
  const [userSession, setUserSession] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'dashboard' | 'chat'>('chat');
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
            <button onClick={() => setView('chat')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${view === 'chat' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>
              <MessageSquare size={16} /> Chat
            </button>
            {userSession.username === 'hemang9705' &&
              <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${view === 'dashboard' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}>
                <LayoutDashboard size={16} /> Admin
              </button>
            }
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            {darkMode ? <Sun className="text-amber-400" size={20} /> : <Moon className="text-gray-600" size={20} />}
          </button>
          <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {view === 'chat' && (
          <aside className="w-64 border-r dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col md:flex">
            <div className="p-4">
              <button
                onClick={startNewChat}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium"
              >
                <Plus size={18} /> New Chat
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent</p>

              {chatList.map((chat) => (
                <div key={chat.chatId} className="group relative flex items-center">
                  <button
                    onClick={() => setActiveChatId(chat.chatId)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center gap-2 transition-colors ${activeChatId === chat.chatId ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                  >
                    <MessageCircle size={14} className="flex-shrink-0" />
                    <span className="truncate pr-8">
                      {chat.title?.split(" ").slice(0, 5).join(" ") || "New Conversation"}
                    </span>
                  </button>

                  {/* Delete Button - only visible on hover */}
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.chatId)}
                    className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 relative overflow-y-auto">
          {view === 'chat' ? (
            <ChatInterface
              user={userSession}
              chatId={activeChatId}
              onNewMessage={refreshChatList}
            />
          ) : (
            <div className="container mx-auto p-6"><Dashboard /></div>
          )}
        </main>
      </div>
    </div>
  );
}