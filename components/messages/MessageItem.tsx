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
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MessageItem({
  message,
  isOwn,
  showAvatar,
  onReply,
  onReact,
  onEdit,
  onDelete
}: MessageItemProps) {
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

        <div className="flex items-center gap-2 w-full">
          {isOwn && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <MessageActions
                isOwn={isOwn}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
              />
            </div>
          )}

          <div className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm text-sm relative transition-all group/bubble",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm border border-border/50",
            isImage && "p-1 overflow-hidden",
            message.isDeleted && "opacity-50 italic"
          )}>
            {/* Reply Context */}
            {message.replyTo && (
              <div className={cn(
                "mb-2 p-2 rounded-lg text-xs border-l-4 bg-black/5 flex flex-col gap-0.5",
                isOwn ? "border-primary-foreground/50" : "border-primary/50"
              )}>
                <span className="font-bold opacity-80">{message.replyTo.senderName}</span>
                <p className="line-clamp-1 italic text-[11px]">
                  {message.replyTo.messageType === 'text' ? message.replyTo.content : 'Image'}
                </p>
              </div>
            )}

            {isText && <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>}

            {isImage && (
              <img
                src={message.mediaUrl}
                alt="Image"
                className="rounded-xl max-w-full h-auto object-cover max-h-80"
              />
            )}

            <div className={cn(
              "flex items-center gap-2 mt-1 justify-end",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {message.isEdited && !message.isDeleted && <span className="text-[9px] uppercase font-bold tracking-wider">Edited</span>}
              <span className="text-[10px]">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {isOwn && (
                message.status === 'read'
                  ? <CheckCheck className="w-3 h-3 text-primary-foreground" />
                  : <Check className="w-3 h-3" />
              )}
            </div>

            {/* Reactions Display */}
            {message.reactions && message.reactions.length > 0 && (
              <div className={cn(
                "absolute -bottom-3 flex flex-wrap gap-1 z-20",
                isOwn ? "right-0" : "left-0"
              )}>
                {message.reactions.map((r: any, idx: number) => (
                  <div key={idx} className="bg-background border rounded-full px-1.5 py-0.5 text-[10px] shadow-sm flex items-center gap-1 hover:scale-110 transition-transform cursor-pointer">
                    <span>{r.emoji}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isOwn && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <MessageActions
                isOwn={isOwn}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageActions({
  isOwn,
  onReply,
  onEdit,
  onDelete,
  onReact
}: {
  isOwn: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
}) {
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors group-hover:text-primary">
            <Smile className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="flex p-1 gap-1 min-w-0 bg-background/95 backdrop-blur-sm">
          {emojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact?.(emoji)}
              className="hover:scale-125 transition-transform p-1.5 text-lg leading-none"
            >
              {emoji}
            </button>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-36">
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onReply}>
            <Reply className="w-4 h-4" /> Reply
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer">
            <Pin className="w-4 h-4" /> Pin
          </DropdownMenuItem>
          {isOwn && (
            <>
              <DropdownMenuItem className="gap-2 cursor-pointer text-blue-500 focus:text-blue-500" onClick={onEdit}>
                <Edit2 className="w-4 h-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
