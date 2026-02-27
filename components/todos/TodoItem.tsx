"use client";

import { Button } from '@/components/ui/button';
import { Todo } from '@/features/todos/todosApi';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  isToggling?: boolean;
  isDeleting?: boolean;
}

export default function TodoItem({ todo, onToggle, onDelete, isToggling, isDeleting }: TodoItemProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden transition-all duration-300 rounded-xl border",
        todo.completed
          ? "bg-accent/5 border-transparent opacity-60 line-through scale-[0.98]"
          : "bg-card border-border hover:border-primary/30 shadow-sm hover:shadow-xl hover:-translate-y-1",
        (isToggling || isDeleting) && "opacity-50 pointer-events-none"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center space-x-5 flex-1 cursor-pointer"
          onClick={() => !todo.completed && !isToggling && onToggle(todo._id, todo.completed)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isToggling) onToggle(todo._id, todo.completed);
            }}
            disabled={isToggling}
            className={cn(
              "w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all border pointer-events-auto",
              todo.completed
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "border-border hover:border-primary"
            )}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : todo.completed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5 text-transparent" />
            )}
          </button>
          <span className={cn("text-lg font-medium transition-all", !todo.completed && "text-foreground")}>
            {todo.task}
          </span>
        </div>

        {!todo.completed ? (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo._id);
              }}
              className="rounded-xl cursor-pointer h-10 w-10 text-muted-foreground hover:text-loss hover:bg-loss/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </Button>
          </div>
        ) : (
          <div className="text-[10px] font-black uppercase tracking-widest text-primary italic">Success</div>
        )}
      </div>

      {!todo.completed && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
      )}
    </div>
  );
}
