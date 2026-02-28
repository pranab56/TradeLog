'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import {
  Check,
  CheckCheck,
  Edit2,
  FileText,
  MoreHorizontal,
  Pin,
  Play,
  Reply,
  Smile,
  Trash2
} from 'lucide-react';
import { useState } from 'react';


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
  const isDocument = message.messageType === 'document';
  const isAudio = message.messageType === 'audio';

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

        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] text-primary/80 mb-1 ml-1 font-bold italic uppercase tracking-tighter">
            <Pin className="w-3 h-3 fill-current" /> Pinned
          </div>
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
                className="rounded-xl max-w-full h-auto object-cover max-h-80 transition-transform hover:scale-[1.02] cursor-pointer"
              />
            )}

            {isDocument && (
              <div className="flex items-center gap-3 p-2 bg-black/10 rounded-xl min-w-[200px]">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{message.content || 'Document.pdf'}</p>
                  <p className="text-[10px] opacity-70">1.2 MB</p>
                </div>
              </div>
            )}

            {isAudio && (
              <div className="flex items-center gap-3 p-2 min-w-[200px]">
                <Button size="icon" variant="ghost" className="rounded-full bg-primary-foreground/20 h-8 w-8">
                  <Play className="w-4 h-4 fill-current" />
                </Button>
                <div className="flex-1 space-y-1">
                  <div className="h-1 bg-primary-foreground/30 rounded-full w-full relative">
                    <div className="absolute left-0 top-0 h-full bg-primary-foreground w-1/3 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>0:12</span>
                    <span>0:45</span>
                  </div>
                </div>
              </div>
            )}

            <div className={cn(
              "flex items-center gap-2 mt-1 justify-end",
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {message.isEdited && !message.isDeleted && <span className="text-[9px] uppercase font-bold tracking-wider">Edited</span>}
              <span className="text-[10px]">
                {dayjs(message.createdAt).format('HH:mm')}
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Message?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Button
              variant="destructive"
              className="w-full rounded-xl py-6"
              onClick={() => {
                onDelete?.(); // Logic for everyone would go here
                setShowDeleteModal(false);
              }}
            >
              Delete for everyone
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl py-6"
              onClick={() => setShowDeleteModal(false)}
            >
              Delete for me only
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="w-full rounded-xl" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
