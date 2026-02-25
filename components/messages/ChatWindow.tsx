'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/providers/socket-provider';
import axios from 'axios';
import {
  Info,
  Loader2,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MessageInput from './MessageInput';
import MessageItem from './MessageItem';



interface ChatWindowProps {
  conversation: any;
  currentUser: any;
}

export default function ChatWindow({ conversation, currentUser }: ChatWindowProps) {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const otherParticipant = !conversation.isGroup
    ? conversation.participants.find((p: any) => p._id !== currentUser?.id)
    : null;

  const title = conversation.isGroup ? conversation.name : otherParticipant?.name;
  const image = conversation.isGroup ? conversation.groupImage : otherParticipant?.profileImage;

  useEffect(() => {
    fetchMessages();

    if (socket) {
      socket.emit('join-room', conversation._id);

      socket.on('receive-message', (message: any) => {
        if (message.conversationId === conversation._id) {
          setMessages(prev => [...prev, message]);
        }
      });

      socket.on('user-typing', (data: any) => {
        if (data.conversationId === conversation._id && data.userId !== currentUser?.id) {
          setTypingUser(data.userName);
        }
      });

      socket.on('user-stop-typing', (data: any) => {
        if (data.conversationId === conversation._id) {
          setTypingUser(null);
        }
      });

      socket.on('message-edited', (updatedMessage: any) => {
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      });

      socket.on('message-deleted', (data: any) => {
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, content: 'This message was deleted', isDeleted: true } : m));
      });

      socket.on('message-reacted', (updatedMessage: any) => {
        setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
      });

      return () => {
        socket.off('receive-message');
        socket.off('user-typing');
        socket.off('user-stop-typing');
        socket.off('message-edited');
        socket.off('message-deleted');
        socket.off('message-reacted');
      };
    }
  }, [conversation._id, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/messages?conversationId=${conversation._id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Fetch messages error', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
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

      if (socket) {
        socket.emit('send-message', newMessage);
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
          <Button variant="ghost" size="icon" className="text-muted-foreground transition-colors hover:text-primary">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground transition-colors hover:text-primary">
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
      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          <div className="space-y-4 max-w-4xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg, index) => (
                <MessageItem
                  key={msg._id}
                  message={msg}
                  isOwn={msg.senderId._id === currentUser?.id}
                  showAvatar={index === 0 || messages[index - 1].senderId._id !== msg.senderId._id}
                  onReply={() => setReplyingTo(msg)}
                  onReact={(emoji) => handleReact(msg._id, emoji)}
                  onEdit={() => setEditingMessage(msg)}
                  onDelete={() => handleDelete(msg._id)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">👋</span>
                </div>
                <h4 className="font-medium">No messages yet</h4>
                <p className="text-sm text-muted-foreground mt-1">Send a message to start the conversation!</p>
              </div>
            )}

            {typingUser && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground ml-12 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>{typingUser} is typing...</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <MessageInput
        onSend={handleSendMessage}
        conversationId={conversation._id}
        currentUser={currentUser}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
    </div>
  );
}
