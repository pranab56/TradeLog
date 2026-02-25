'use client';

import ChatSidebar from '@/components/messages/ChatSidebar';

import { useSocket } from '@/providers/socket-provider';
import axios from 'axios';
import { useEffect, useState } from 'react';
import ChatWindow from '../../components/messages/ChatWindow';

export default function MessagesPage() {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('receive-message', (message: any) => {
        // Update conversation list with last message
        setConversations(prev => prev.map(conv => {
          if (conv._id === message.conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: new Date(),
            };
          }
          return conv;
        }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      });

      return () => {
        socket.off('receive-message');
      };
    }
  }, [socket]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data.user);
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/conversations');
      setConversations(res.data.conversations);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-background border rounded-2xl shadow-sm">
      <ChatSidebar
        conversations={conversations}
        onSelect={setSelectedConversation}
        selectedId={selectedConversation?._id}
        loading={loading}
        currentUser={currentUser}
        onConversationCreated={fetchConversations}
      />

      {selectedConversation ? (
        <ChatWindow
          conversation={selectedConversation}
          currentUser={currentUser}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 bg-muted/10">
          <div className="w-24 h-24 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Select a conversation</h2>
          <p className="max-w-xs text-center mt-2">
            Choose a contact from the sidebar or search for new people to start messaging.
          </p>
        </div>
      )}
    </div>
  );
}