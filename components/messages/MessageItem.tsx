'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Check,
  CheckCheck,
  Edit2,
  MoreHorizontal,
  Pin,
  Reply,
  Smile,
  Trash2
} from 'lucide-react';

interface MessageItemProps {
  message: any;
  isOwn: boolean;
  showAvatar: boolean;
}

export default function MessageItem({ message, isOwn, showAvatar }: MessageItemProps) {
  const isText = message.messageType === 'text';
  const isImage = message.messageType === 'image';

  return (
    <div className={cn(
      "group flex items-end gap-2 mb-1",
      isOwn ? "flex-row-reverse" : "flex-row",
      !showAvatar && (isOwn ? "mr-10" : "ml-10")
    )}>
      {!isOwn && showAvatar && (
        <Avatar className="w-8 h-8 flex-shrink-0 mb-1 ring-1 ring-primary/5">
          <AvatarImage src={message.senderId.profileImage} />
          <AvatarFallback className="bg-primary/5 text-[10px] text-primary">
            {message.senderId.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "relative max-w-[70%] flex flex-col",
        isOwn ? "items-end" : "items-start"
      )}>
        {showAvatar && !isOwn && (
          <span className="text-[10px] text-muted-foreground ml-1 mb-1 font-medium">
            {message.senderId.name}
          </span>
        )}

        <div className="flex items-center gap-2">
          {isOwn && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageActions isOwn={isOwn} />
            </div>
          )}

          <div className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm text-sm relative transition-all",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm border border-border/50",
            isImage && "p-1 overflow-hidden"
          )}>
            {isText && <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>}

            {isImage && (
              <img
                src={message.mediaUrl}
                alt="Image"
                className="rounded-xl max-w-full h-auto object-cover max-h-80"
              />
            )}

            <div className={cn(
              "flex items-center gap-1 mt-1 justify-end",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              <span className="text-[10px]">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {isOwn && (
                message.status === 'read'
                  ? <CheckCheck className="w-3 h-3 text-primary-foreground" />
                  : <Check className="w-3 h-3" />
              )}
            </div>
          </div>

          {!isOwn && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MessageActions isOwn={isOwn} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageActions({ isOwn }: { isOwn: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-36">
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Reply className="w-4 h-4" /> Reply
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Smile className="w-4 h-4" /> React
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Pin className="w-4 h-4" /> Pin
        </DropdownMenuItem>
        {isOwn && (
          <>
            <DropdownMenuItem className="gap-2 cursor-pointer text-blue-500 focus:text-blue-500">
              <Edit2 className="w-4 h-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
