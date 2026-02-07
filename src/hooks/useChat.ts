import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Chat, Message } from '../types';
import { getTheologian } from '../data/theologians';
import { streamTheologianResponse } from '../api/claude';
import { loadChats, saveChats } from '../utils/storage';

export function useChat(apiKey: string) {
  const [chats, setChats] = useState<Chat[]>(() => loadChats());
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const persistChats = useCallback((updated: Chat[]) => {
    setChats(updated);
    saveChats(updated);
  }, []);

  const createChat = useCallback(
    (theologianId: string): Chat => {
      const theologian = getTheologian(theologianId);
      const chat: Chat = {
        id: uuidv4(),
        title: `New conversation with ${theologian?.shortName || theologianId}`,
        theologianId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [chat, ...chats];
      persistChats(updated);
      return chat;
    },
    [chats, persistChats]
  );

  const sendMessage = useCallback(
    async (chatId: string, content: string) => {
      setError(null);

      const chatIndex = chats.findIndex((c) => c.id === chatId);
      if (chatIndex === -1) return;

      const chat = chats[chatIndex];
      const theologian = getTheologian(chat.theologianId);
      if (!theologian) return;

      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      const updatedMessages = [...chat.messages, userMessage];
      const isFirstMessage = chat.messages.length === 0;
      const title = isFirstMessage
        ? content.length > 60
          ? content.slice(0, 57) + '...'
          : content
        : chat.title;

      const updatedChat: Chat = {
        ...chat,
        messages: updatedMessages,
        title,
        updatedAt: Date.now(),
      };

      const updatedChats = [...chats];
      updatedChats[chatIndex] = updatedChat;
      persistChats(updatedChats);

      setIsStreaming(true);
      setStreamingContent('');

      const controller = new AbortController();
      abortRef.current = controller;

      await streamTheologianResponse(
        theologian,
        updatedMessages,
        apiKey,
        {
          onToken: (token) => {
            setStreamingContent((prev) => prev + token);
          },
          onDone: (fullText) => {
            const assistantMessage: Message = {
              id: uuidv4(),
              role: 'assistant',
              content: fullText,
              theologianId: theologian.id,
              timestamp: Date.now(),
            };
            const finalChat: Chat = {
              ...updatedChat,
              messages: [...updatedMessages, assistantMessage],
              updatedAt: Date.now(),
            };
            const finalChats = [...updatedChats];
            finalChats[chatIndex] = finalChat;
            persistChats(finalChats);
            setIsStreaming(false);
            setStreamingContent('');
          },
          onError: (errorMsg) => {
            setError(errorMsg);
            setIsStreaming(false);
            setStreamingContent('');
          },
        },
        controller.signal
      );
    },
    [chats, apiKey, persistChats]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  const deleteChat = useCallback(
    (chatId: string) => {
      persistChats(chats.filter((c) => c.id !== chatId));
    },
    [chats, persistChats]
  );

  return {
    chats,
    streamingContent,
    isStreaming,
    error,
    createChat,
    sendMessage,
    stopStreaming,
    deleteChat,
  };
}
