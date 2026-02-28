'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/providers/socket-provider';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Info,
  Loader2,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { toast } from 'sonner';
import CallOverlay from './CallOverlay';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';



interface ChatWindowProps {
  conversation: any;
  currentUser: any;
  onMessageSent?: (msg: any) => void;
}

// Normalize any ID (string, ObjectId, {$oid:...}) to a plain string
const toStr = (id: any): string => {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id.$oid) return id.$oid;
  if (typeof id === 'object' && id.toString) return id.toString();
  return String(id);
};

export default function ChatWindow({ conversation, currentUser, onMessageSent }: ChatWindowProps) {
  const { socket, isConnected } = useSocket();
  const convId = toStr(conversation._id);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const [isCalling, setIsCalling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const otherParticipant = !conversation.isGroup
    ? conversation.participants.find((p: any) => p._id !== currentUser?.id)
    : null;

  const title = conversation.isGroup ? conversation.name : otherParticipant?.name;
  const image = conversation.isGroup ? conversation.groupImage : otherParticipant?.profileImage;

  useEffect(() => {
    fetchMessages();
  }, [convId]);

  useEffect(() => {
    if (!socket) return;

    // Join conversation room — also rejoin on reconnect
    const joinRoom = () => {
      console.log('[ChatWindow] Joining room:', convId);
      socket.emit('join-room', convId);
    };

    // Join immediately if already connected
    if (socket.connected) joinRoom();

    // Re-join on every (re)connect
    socket.on('connect', joinRoom);

    const onReceiveMessage = (message: any) => {
      if (toStr(message.conversationId) === convId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const onUserTyping = (data: any) => {
      if (toStr(data.conversationId) === convId && toStr(data.userId) !== toStr(currentUser?.id)) {
        setTypingUser(data.userName);
      }
    };

    const onUserStopTyping = (data: any) => {
      if (toStr(data.conversationId) === convId) {
        setTypingUser(null);
      }
    };

    const onMessageEdited = (updatedMessage: any) => {
      setMessages(prev => prev.map(m => toStr(m._id) === toStr(updatedMessage._id) ? updatedMessage : m));
    };

    const onMessageDeleted = (data: any) => {
      setMessages(prev => prev.map(m => toStr(m._id) === toStr(data.messageId) ? { ...m, content: 'This message was deleted', isDeleted: true } : m));
    };

    const onMessageReacted = (updatedMessage: any) => {
      setMessages(prev => prev.map(m => toStr(m._id) === toStr(updatedMessage._id) ? updatedMessage : m));
    };

    const onMessageRead = (data: any) => {
      if (toStr(data.conversationId) === convId) {
        setMessages(prev => prev.map(m => {
          // If the message was sent by the current user and the other person read it, mark it as read
          if (toStr(m.senderId._id) === toStr(currentUser?.id) && toStr(currentUser?.id) !== toStr(data.userId)) {
            return { ...m, status: 'read' };
          }
          return m;
        }));
      }
    };

    socket.on('receive-message', onReceiveMessage);
    socket.on('user-typing', onUserTyping);
    socket.on('user-stop-typing', onUserStopTyping);
    socket.on('message-edited', onMessageEdited);
    socket.on('message-deleted', onMessageDeleted);
    socket.on('message-reacted', onMessageReacted);
    socket.on('message-read', onMessageRead);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive-message', onReceiveMessage);
      socket.off('user-typing', onUserTyping);
      socket.off('user-stop-typing', onUserStopTyping);
      socket.off('message-edited', onMessageEdited);
      socket.off('message-deleted', onMessageDeleted);
      socket.off('message-reacted', onMessageReacted);
      socket.off('message-read', onMessageRead);
    };
  }, [convId, socket, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/messages?conversationId=${conversation._id}`);
      setMessages(res.data.messages);

      // Mark as read
      await axios.post('/api/conversations/read', { conversationId: conversation._id });
      if (socket) socket.emit('mark-read', { conversationId: conversation._id, userId: currentUser?.id });
    } catch (err) {
      console.error('Fetch messages error', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (scrollRef.current) {
      // With flex-col-reverse layout, the bottom is automatically maintained
      // and scrollTo({top: 0}) might not be necessary or behaves differently,
      // but if we need to ensure we are at the bottom:
      scrollRef.current.scrollTo({
        top: 0,
        behavior
      });
    }
  };

  const handleSendMessage = async (content: string, type: string = 'text', mediaUrl?: string) => {
    try {
      if (editingMessage) {
        const res = await axios.patch('/api/messages', {
          messageId: editingMessage._id,
          type: 'edit',
          content
        });
        const updatedMessage = res.data.message;
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
        setEditingMessage(null);
        if (socket) socket.emit('edit-message', updatedMessage);
        return;
      }

      const res = await axios.post('/api/messages', {
        conversationId: conversation._id,
        content,
        messageType: type,
        mediaUrl,
        replyTo: replyingTo?._id
      });
      // ... same as before
      const newMessage = res.data.message;

      if (replyingTo) {
        newMessage.replyTo = {
          _id: replyingTo._id,
          content: replyingTo.content,
          messageType: replyingTo.messageType,
          senderName: replyingTo.senderId.name
        };
      }

      setMessages(prev => [...prev, newMessage]);
      setReplyingTo(null);
      if (onMessageSent) onMessageSent(newMessage);

      if (socket) {
        socket.emit('send-message', {
          ...newMessage,
          participants: conversation.participants.map((p: any) => p._id)
        });
      }
    } catch (err) {
      console.error('Send message error', err);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await axios.patch('/api/messages', { messageId, type: 'react', emoji });
      const updatedMessage = res.data.message;
      setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      if (socket) socket.emit('react-message', updatedMessage);
    } catch (err) {
      console.error('React error', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await axios.delete(`/api/messages?messageId=${messageId}`);
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, content: 'This message was deleted', isDeleted: true } : m));
      if (socket) socket.emit('delete-message', { conversationId: conversation._id, messageId });
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-card/30">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-primary/10">
            <AvatarImage src={image} />
            <AvatarFallback className="bg-primary/5 text-primary">
              {title?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold leading-none mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {conversation.isGroup
                ? `${conversation.participants.length} members`
                : (otherParticipant?.onlineStatus === 'online' ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Online
                  </span>
                ) : 'Offline')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground transition-colors hover:text-primary"
            onClick={() => {
              if (conversation.isBlocked) return toast.error('Calling is restricted because this chat is blocked.');
              setIsCalling(true);
            }}
          >
            <Phone className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground transition-colors hover:text-primary"
            onClick={() => {
              if (conversation.isBlocked) return toast.error('Calling is restricted because this chat is blocked.');
              toast.info('Video calling coming soon!');
            }}
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground transition-colors hover:text-primary">
            <Info className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground transition-colors hover:text-primary">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 relative overflow-hidden"
        id="scrollableDiv"
        ref={scrollRef}
        style={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column-reverse' }}
      >
        <InfiniteScroll
          dataLength={messages.length}
          next={() => { }} // Handle pagination logic here
          hasMore={false}
          loader={<div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          scrollableTarget="scrollableDiv"
          inverse={true}
          style={{ display: 'flex', flexDirection: 'column-reverse', width: '100%' }}
          className="p-4 w-full"
        >
          <div className="space-y-1.5 space-y-reverse flex flex-col-reverse w-full pb-4">
            {typingUser && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-12 mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>{typingUser} is typing...</span>
              </div>
            )}

            {[...messages].reverse().map((msg, index, reversedArr) => (
              <motion.div
                key={msg._id}
                className="w-full"
                initial={{ opacity: 0, scale: 0.98, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <MessageItem
                  message={msg}
                  isOwn={msg.senderId._id === currentUser?.id}
                  showAvatar={index === 0 || reversedArr[index - 1]?.senderId._id !== msg.senderId._id}
                  onReply={() => setReplyingTo(msg)}
                  onReact={(emoji) => handleReact(msg._id, emoji)}
                  onEdit={() => setEditingMessage(msg)}
                  onDelete={() => handleDelete(msg._id)}
                />
              </motion.div>
            ))}

            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full my-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">👋</span>
                </div>
                <h4 className="font-medium">No messages yet</h4>
                <p className="text-sm text-muted-foreground mt-1">Send a message to start the conversation!</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </InfiniteScroll>
      </div>

      {/* Input Area */}
      {conversation.isBlocked ? (
        <div className="p-4 text-center bg-muted w-full border-t border-border">
          <p className="font-semibold text-muted-foreground">You cannot reply to this conversation</p>
        </div>
      ) : (
        <MessageInput
          onSend={handleSendMessage}
          conversationId={conversation._id}
          currentUser={currentUser}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
        />
      )}

      {/* Call UI */}
      <CallOverlay
        isOpen={isCalling}
        onHangup={() => setIsCalling(false)}
        user={otherParticipant}
      />
    </div>
  );
}
