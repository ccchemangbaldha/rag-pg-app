import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageCircle,
  Trash2,
  Menu
} from "lucide-react";

interface Chat {
  chatId: string;
  title?: string;
}

interface SidebarProps {
  chatList: Chat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (e: React.MouseEvent, chatId: string) => void;
}

export const Sidebar = ({
  chatList,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat
}: SidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsExpanded(!isExpanded);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Conversations
            </motion.h2>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:flex"
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isExpanded ? (
            <ChevronLeft size={18} className="text-gray-500" />
          ) : (
            <ChevronRight size={18} className="text-gray-500" />
          )}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium ${
            !isExpanded ? "justify-center px-0" : "justify-center px-4"
          }`}
          title={!isExpanded ? "New Chat" : undefined}
        >
          <Plus size={18} />
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Recent
            </motion.p>
          )}
        </AnimatePresence>

        {chatList.map((chat) => (
          <div key={chat.chatId} className="group relative flex items-center">
            <button
              onClick={() => onSelectChat(chat.chatId)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                activeChatId === chat.chatId
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
              } ${!isExpanded ? "justify-center" : ""}`}
              title={
                !isExpanded
                  ? chat.title?.split(" ").slice(0, 5).join(" ") ||
                    "New Conversation"
                  : undefined
              }
            >
              <MessageCircle size={14} className="flex-shrink-0" />
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="truncate pr-8"
                  >
                    {chat.title?.split(" ").slice(0, 5).join(" ") ||
                      "New Conversation"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Delete Button - only visible when expanded and on hover */}
            <AnimatePresence>
              {isExpanded && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => onDeleteChat(e, chat.chatId)}
                  className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Trash2 size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 256 : 72
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex flex-col border-r dark:border-gray-800 bg-white dark:bg-gray-900 relative"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobile}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-64 z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
