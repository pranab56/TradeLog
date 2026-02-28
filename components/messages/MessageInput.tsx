'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSocket } from '@/providers/socket-provider';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import {
  Edit2,
  Image as ImageIcon,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  Send,
  Smile,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MessageInputProps {
  onSend: (content: string, type?: string, mediaUrl?: string) => void;
  conversationId: string;
  currentUser: any;
  replyingTo?: any;
  onCancelReply?: () => void;
  editingMessage?: any;
  onCancelEdit?: () => void;
}

export default function MessageInput({
  onSend,
  conversationId,
  currentUser,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
    } else {
      setContent('');
    }
  }, [editingMessage]);

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

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload - in a real app, you'd use FormData and an upload API
    try {
      setIsUploading(true);

      // For demo purposes, we'll use a FileReader to get a base64 string
      // In production, this should be a URL from S3/Cloudinary/etc.
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onSend("Sent an image", 'image', base64String);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);

      // Reset input
      e.target.value = '';
    } catch (err) {
      console.error('Upload error', err);
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border-t bg-card/50 backdrop-blur-sm relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Reply Preview */}
      {replyingTo && (
        <div className="absolute bottom-full left-0 right-0 bg-muted/90 backdrop-blur-md p-3 border-t flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-1 bg-primary h-10 rounded-full" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-primary">Replying to {replyingTo.senderId.name}</p>
              <p className="text-sm text-muted-foreground truncate italic">
                {replyingTo.messageType === 'text' ? replyingTo.content : 'Image'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Editing Preview */}
      {editingMessage && (
        <div className="absolute bottom-full left-0 right-0 bg-primary/10 backdrop-blur-md p-3 border-t border-primary/20 flex items-center justify-between animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-primary">Editing Message</p>
              <p className="text-sm text-muted-foreground truncate italic">{editingMessage.content}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelEdit} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-3 rounded-2xl hover:bg-muted text-muted-foreground transition-colors flex-shrink-0 mb-1">
              <Plus className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 p-2">
            <DropdownMenuItem className="gap-2 cursor-pointer p-2 rounded-lg" onClick={handleFileClick}>
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
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
            className="w-full bg-muted/60 border-none rounded-2xl px-5 py-3 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[48px] max-h-32 shadow-inner"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute right-2 text-muted-foreground hover:text-primary transition-colors">
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="p-0 border-none shadow-2xl rounded-2xl overflow-hidden mb-4">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => setContent(prev => prev + emoji.native)}
                theme="light"
                set="native"
                previewPosition="none"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          onClick={handleSend}
          disabled={!content.trim() || isUploading}
          className={cn(
            "rounded-2xl w-12 h-12 flex-shrink-0 transition-all transform active:scale-95 shadow-lg",
            content.trim() ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          )}
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}

// Simple cn utility if not already present or for local use
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
