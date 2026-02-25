'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSocket } from '@/providers/socket-provider';
import {
  Image as ImageIcon,
  Mic,
  Paperclip,
  Plus,
  Send,
  Smile
} from 'lucide-react';
import { useRef, useState } from 'react';

interface MessageInputProps {
  onSend: (content: string, type?: string, mediaUrl?: string) => void;
  conversationId: string;
  currentUser: any;
}

export default function MessageInput({ onSend, conversationId, currentUser }: MessageInputProps) {
  const [content, setContent] = useState('');
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<any>(null);

  const handleSend = () => {
    if (content.trim()) {
      onSend(content);
      setContent('');
      if (socket) {
        socket.emit('stop-typing', { conversationId, userId: currentUser?.id });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (socket) {
      socket.emit('typing', {
        conversationId,
        userId: currentUser?.id,
        userName: currentUser?.name
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', { conversationId, userId: currentUser?.id });
      }, 3000);
    }
  };

  return (
    <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 mb-1">
              <Plus className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 p-2">
            <DropdownMenuItem className="gap-2 cursor-pointer p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              Photos & Videos
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Paperclip className="w-4 h-4" />
              </div>
              Document
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              Voice Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 relative flex items-center">
          <textarea
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-muted/60 border-none rounded-2xl px-5 py-3 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[48px] max-h-32"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <Button variant="ghost" size="icon" className="absolute right-2 text-muted-foreground hover:text-primary transition-colors">
            <Smile className="w-5 h-5" />
          </Button>
        </div>

        <Button
          onClick={handleSend}
          disabled={!content.trim()}
          className={cn(
            "rounded-2xl w-12 h-12 flex-shrink-0 transition-all transform active:scale-95 shadow-lg",
            content.trim() ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          )}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Simple cn utility if not already present or for local use
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
