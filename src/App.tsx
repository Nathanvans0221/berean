import { useState, useCallback } from 'react';
import type { ViewMode } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { CompareView } from './components/CompareView';
import { SettingsModal } from './components/SettingsModal';
import { useChat } from './hooks/useChat';
import { loadApiKey, saveApiKey } from './utils/storage';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('chat');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [selectedTheologian, setSelectedTheologian] = useState('sproul');
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [showSettings, setShowSettings] = useState(false);

  const {
    chats,
    streamingContent,
    isStreaming,
    error,
    createChat,
    sendMessage,
    stopStreaming,
    deleteChat,
  } = useChat(apiKey);

  const handleNewChat = useCallback(() => {
    const chat = createChat(selectedTheologian);
    setActiveChat(chat.id);
    setCurrentView('chat');
  }, [createChat, selectedTheologian]);

  const handleSaveApiKey = useCallback((key: string) => {
    setApiKey(key);
    saveApiKey(key);
  }, []);

  const handleDeleteChat = useCallback(
    (chatId: string) => {
      deleteChat(chatId);
      if (activeChat === chatId) {
        setActiveChat(null);
      }
    },
    [deleteChat, activeChat]
  );

  const currentChat = chats.find((c) => c.id === activeChat) || null;

  return (
    <div className="h-screen flex flex-col bg-navy-950 text-white">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {currentView === 'chat' && (
          <Sidebar
            chats={chats}
            activeChat={activeChat}
            selectedTheologian={selectedTheologian}
            onSelectChat={setActiveChat}
            onNewChat={handleNewChat}
            onDeleteChat={handleDeleteChat}
            onSelectTheologian={setSelectedTheologian}
          />
        )}

        {currentView === 'chat' ? (
          <ChatView
            chat={currentChat}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            error={error}
            selectedTheologian={selectedTheologian}
            onSendMessage={sendMessage}
            onStopStreaming={stopStreaming}
            onNewChat={handleNewChat}
          />
        ) : (
          <CompareView apiKey={apiKey} />
        )}
      </div>

      <SettingsModal
        isOpen={showSettings}
        apiKey={apiKey}
        onSave={handleSaveApiKey}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
