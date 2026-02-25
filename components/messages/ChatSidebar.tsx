'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MessageSquarePlus, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import SearchUsers from './SearchUsers';
import GroupModal from './GroupModal';



interface ChatSidebarProps {
  conversations: any[];
  onSelect: (conv: any) => void;
  selectedId?: string;
  loading: boolean;
  currentUser: any;
  onConversationCreated: () => void;
}

export default function ChatSidebar({
  conversations,
  onSelect,
  selectedId,
  loading,
  currentUser,
  onConversationCreated
}: ChatSidebarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
    if (conv.isGroup) {
      return conv.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const otherParticipant = conv.participants.find((p: any) => p._id !== currentUser?.id);
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-[350px] flex flex-col border-r bg-card">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h1 className="text-xl font-bold">Messages</h1>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(true)}
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGroupModal(true)}
            title="New Group"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-muted/50 border-none transition-all focus-visible:bg-muted"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const otherParticipant = !conv.isGroup
                ? conv.participants.find((p: any) => p._id !== currentUser?.id)
                : null;

              const title = conv.isGroup ? conv.name : otherParticipant?.name;
              const image = conv.isGroup ? conv.groupImage : otherParticipant?.profileImage;

              return (
                <button
                  key={conv._id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-muted/50 group text-left",
                    selectedId === conv._id && "bg-primary/10 hover:bg-primary/20"
                  )}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                      <AvatarImage src={image} />
                      <AvatarFallback className="bg-primary/5 text-primary text-lg">
                        {title?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {!conv.isGroup && otherParticipant?.onlineStatus === 'online' && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-semibold truncate pr-2">{title}</span>
                      {conv.lastMessage && (
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(conv.updatedAt), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground truncate flex-1">
                        {conv.lastMessage ? (
                          conv.lastMessage.content
                        ) : (
                          <span className="italic">No messages yet</span>
                        )}
                      </p>
                      {/* Unread dot example */}
                      {/* <div className="w-2 h-2 rounded-full bg-primary" /> */}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No conversations found
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Search Modal */}
      <SearchUsers
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelect={(user) => {
          setShowSearch(false);
          // Handle starting conversation
          onConversationCreated();
        }}
        currentUser={currentUser}
      />

      {/* Group Creation Modal */}
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onCreated={() => {
          setShowGroupModal(false);
          onConversationCreated();
        }}
        currentUser={currentUser}
      />
    </div>
  );
}
