'use client';

import MainLayout from '@/components/layout/MainLayout';
import ChatSidebar from '@/components/messages/ChatSidebar';
import ChatWindow from '@/components/messages/ChatWindow';
import { useSocket } from '@/providers/socket-provider';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Normalize any MongoDB ObjectId / string to a plain string
const toStr = (id: any): string => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  if (typeof id === 'object' && typeof id.toString === 'function') return id.toString();
  return String(id);
};

export default function MessagesPage() {
  const { socket, isConnected } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Refs to always have the latest values in event callbacks without stale closures
  const currentUserRef = useRef<any>(null);
  const selectedConvRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const convRef = useRef<any[]>([]);

  useEffect(() => {
    audioRef.current = new Audio('/audio/audio.mp3');
  }, []);

  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { selectedConvRef.current = selectedConversation; }, [selectedConversation]);
  useEffect(() => { convRef.current = conversations; }, [conversations]);

  // ─── Data Fetchers ───────────────────────────────────────────────
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setCurrentUser(res.data.user);
      return res.data.user;
    } catch (err) {
      console.error('[MessagesPage] Failed to fetch user', err);
      return null;
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get('/api/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('[MessagesPage] Failed to fetch requests', err);
    }
  }, []);

  const fetchConversations = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await axios.get('/api/conversations');
      const newConversations = res.data.conversations;
      setConversations(newConversations);

      const selConv = selectedConvRef.current;
      if (selConv) {
        const stillExists = newConversations.find((c: any) => toStr(c._id) === toStr(selConv._id));
        if (!stillExists) setSelectedConversation(null);
      }
    } catch (err) {
      console.error('[MessagesPage] Failed to fetch conversations', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // ─── Initial Load ────────────────────────────────────────────────
  useEffect(() => {
    fetchCurrentUser();
    fetchConversations(true);
    fetchRequests();
  }, []);

  // ─── Join personal room whenever we have both socket + user ──────
  // This is separated from the event listener setup on purpose.
  const joinPersonalRoom = useCallback(() => {
    if (!socket || !currentUserRef.current) return;
    const uId = toStr(currentUserRef.current.id);
    if (!uId) return;
    console.log('[MessagesPage] Emitting join-user:', uId, '| socket.connected:', socket.connected);
    socket.emit('join-user', uId);
  }, [socket]);

  useEffect(() => {
    if (!socket || !currentUser) return;
    // Join immediately if already connected
    if (socket.connected) joinPersonalRoom();
    // Re-join on every reconnect
    socket.on('connect', joinPersonalRoom);
    return () => { socket.off('connect', joinPersonalRoom); };
  }, [socket, currentUser, joinPersonalRoom]);

  // ─── Socket Event Listeners ──────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (message: any) => {
      const msgConvId = toStr(message.conversationId);
      setConversations(prev => {
        const exists = prev.find(c => toStr(c._id) === msgConvId);
        if (!exists) {
          fetchConversations();
          return prev;
        }
        const isCurrentlyOpen = toStr(selectedConvRef.current?._id) === msgConvId;
        if (isCurrentlyOpen) {
          // We are currently looking at this conversation, so mark read automatically
          axios.post('/api/conversations/read', { conversationId: msgConvId }).catch(() => { });
          if (socket) socket.emit('mark-read', { conversationId: msgConvId });
        }

        return prev
          .map(conv => {
            if (toStr(conv._id) !== msgConvId) return conv;
            const isSentByMe = toStr(message.senderId?._id || message.senderId) === toStr(currentUserRef.current?._id || currentUserRef.current?.id);
            return {
              ...conv,
              lastMessage: message,
              updatedAt: new Date(),
              unreadCount: (isCurrentlyOpen || isSentByMe) ? 0 : (conv.unreadCount || 0) + 1
            };
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    const onReceiveMessage = (message: any) => {
      console.log('[MessagesPage] receive-message:', message.conversationId);
      handleIncomingMessage(message);
    };

    const onNewMessageNotification = async (message: any) => {
      handleIncomingMessage(message);
      const user = currentUserRef.current;
      const senderId = toStr(message.senderId?._id || message.senderId);
      const myId = toStr(user?.id);
      if (senderId && myId && senderId !== myId) {
        const conv = convRef.current.find((c: any) => toStr(c._id) === toStr(message.conversationId));
        // Fallback to false if the conversation hasn't loaded in local state yet
        const isMuted = conv ? conv.isMuted : false;

        if (!isMuted) {
          toast.info(`New message from ${message.senderId?.name || 'someone'}`);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.log('Audio playback prevented by browser:', err));
          }
        }
      }
    };

    const onReceiveInvite = (data: any) => {
      console.log('[MessagesPage] receive-invite:', data);
      toast.info(`New message request from ${data.senderName}`);
      fetchRequests();
    };

    const onReceiveInviteAccepted = (data: any) => {
      console.log('[MessagesPage] receive-invite-accepted:', data);
      toast.success(`${data.receiverName} accepted your invite`);
      fetchConversations();
      fetchRequests();
    };

    const onConversationCreated = (data: any) => {
      console.log('[MessagesPage] conversation-created/updated');
      if (data.action === 'block' && data.isBlocked) {
        toast.error(`${data.blockedBy} blocked you.`);
      }
      fetchConversations();
    };

    const onConversationDeleted = (data: any) => {
      console.log('[MessagesPage] conversation-deleted');
      fetchConversations();
    };

    const onMessageRead = (data: any) => {
      fetchConversations();
    };

    const onPresenceUpdate = ({ userId, status }: any) => {
      const uId = toStr(userId);
      setConversations(prev => prev.map(conv => {
        if (conv.isGroup) return conv;
        return {
          ...conv,
          participants: conv.participants.map((p: any) =>
            toStr(p._id) === uId ? { ...p, onlineStatus: status } : p
          ),
        };
      }));
    };

    socket.on('receive-message', onReceiveMessage);
    socket.on('new-message-notification', onNewMessageNotification);
    socket.on('receive-invite', onReceiveInvite);
    socket.on('receive-invite-accepted', onReceiveInviteAccepted);
    socket.on('conversation-created', onConversationCreated);
    socket.on('conversation-deleted', onConversationDeleted);
    socket.on('presence-update', onPresenceUpdate);
    socket.on('message-read', onMessageRead);

    return () => {
      socket.off('receive-message', onReceiveMessage);
      socket.off('new-message-notification', onNewMessageNotification);
      socket.off('receive-invite', onReceiveInvite);
      socket.off('receive-invite-accepted', onReceiveInviteAccepted);
      socket.off('conversation-created', onConversationCreated);
      socket.off('conversation-deleted', onConversationDeleted);
      socket.off('presence-update', onPresenceUpdate);
      socket.off('message-read', onMessageRead);
    };
  }, [socket]);

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-background border rounded-2xl shadow-sm">
        <ChatSidebar
          conversations={conversations}
          requests={requests}
          onSelect={(conv) => {
            setSelectedConversation(conv);
            // Optimistically clear unread count for real-time visual update
            setConversations(prev => prev.map(c =>
              toStr(c._id) === toStr(conv._id) ? { ...c, unreadCount: 0 } : c
            ));
          }}
          selectedId={selectedConversation?._id}
          loading={loading}
          currentUser={currentUser}
          onConversationCreated={() => {
            fetchConversations();
            fetchRequests();
          }}
          isConnected={isConnected}
        />

        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            currentUser={currentUser}
            onMessageSent={(msg) => {
              setConversations(prev => {
                const updated = prev.map(c =>
                  toStr(c._id) === toStr(msg.conversationId)
                    ? { ...c, lastMessage: msg, updatedAt: new Date(), unreadCount: 0 }
                    : c
                );
                return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
              });
            }}
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
    </MainLayout>
  );
}
