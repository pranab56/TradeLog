"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AlertCircle, AtSign, CheckCircle2, Clock, Loader2, Save } from 'lucide-react';
import { memo } from 'react';

interface SettingsActionBarProps {
  sessionDate: Date | undefined;
  message: { text: string; type: 'success' | 'error' } | null;
  isUpdating: boolean;
  handleSave: () => void;
  name: string;
  username: string;
}

const SettingsActionBar = ({
  sessionDate,
  message,
  isUpdating,
  handleSave,
  name,
  username
}: SettingsActionBarProps) => {
  return (
    <div className="mt-20 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-16">
      <div className="md:hidden pt-4">
        <h2 className="text-2xl font-semibold">{name || 'Your Name'}</h2>
        <p className="text-muted-foreground font-semibold flex items-center">
          <AtSign className="w-4 h-4 mr-1 opacity-50" /> {username || 'username'}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-semibold flex items-center bg-accent/10 px-4 py-2 rounded-full w-fit">
          <Clock className="w-4 h-4 mr-2" />
          Session Data: {sessionDate ? format(sessionDate, 'MMMM yyyy') : 'N/A'}
        </p>
      </div>
      <div className="flex items-center space-x-4">
        {message && (
          <div className={cn(
            "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold animate-in fade-in slide-in-from-right-4",
            message.type === 'success' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}
        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="rounded-2xl px-8 h-12 shadow-xl cursor-pointer shadow-primary/20 font-semibold active:scale-95 transition-transform disabled:opacity-50 text-white"
        >
          {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Commit Changes
        </Button>
      </div>
    </div>
  );
};

export default memo(SettingsActionBar);
