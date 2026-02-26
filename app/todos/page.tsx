"use client";

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from "@/components/ui/progress";
import {
  useAddTodoMutation,
  useDeleteTodoMutation,
  useGetTodosQuery,
  useUpdateTodoMutation
} from '@/features/todos/todosApi';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  Zap
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Todo {
  _id: string;
  task: string;
  completed: boolean;
  createdAt: string;
}

export default function TodosPage() {
  const { data: todos = [], isLoading } = useGetTodosQuery(undefined);
  const [addTodo] = useAddTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();

  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const prevProgressRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const completedCount = todos.filter((t: Todo) => t.completed).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  useEffect(() => {
    if (mounted && !isLoading) {
      if (progress === 100 && todos.length > 0 && prevProgressRef.current < 100) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 5000);
      }
      prevProgressRef.current = progress;
    }
  }, [progress, todos.length, isLoading, mounted]);

  const handleAddTodo = async () => {
    if (!inputValue.trim()) return;
    try {
      await addTodo({ task: inputValue.trim() }).unwrap();
      setInputValue('');
    } catch (err) {
      console.error('Failed to add todo:', err);
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      await updateTodo({ id, completed: !completed }).unwrap();
    } catch (err) {
      console.error('Failed to update todo:', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id).unwrap();
    } catch (err) {
      console.error('Failed to delete todo:', err);
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter((t: Todo) => t.completed);
    for (const todo of completedTodos) {
      await handleDeleteTodo(todo._id);
    }
  };

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">

        {/* Celebration Overlay */}
        {showCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-background/80 backdrop-blur-xl p-12 rounded-[40px] border-4 border-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)] flex flex-col items-center animate-in zoom-in duration-500">
              <div className="relative mb-6">
                <Trophy className="w-24 h-24 text-primary animate-bounce" />
                <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-amber-400 animate-pulse" />
                <Star className="absolute -bottom-4 -left-4 w-10 h-10 text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-2">Elite Discipline!</h2>
              <p className="text-muted-foreground font-bold uppercase text-sm tracking-widest">Day mission fully accomplished</p>

              <div className="absolute inset-0 overflow-hidden rounded-[40px]">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-ping"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      backgroundColor: i % 2 === 0 ? 'var(--primary)' : '#fbbf24',
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${1 + Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase italic text-primary drop-shadow-sm">Operation: Discipline</h1>
            <p className="text-muted-foreground font-bold flex items-center uppercase text-xs tracking-[0.2em]">
              <Target className="w-4 h-4 mr-2 text-primary" />
              Success is the sum of small, repeated actions.
            </p>
          </div>
          <div className="bg-card border border-border p-4 px-6 rounded-3xl shadow-xl flex items-center space-x-6 min-w-[240px]">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span>Progress</span>
                <span className="text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 rounded-full" />
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action input box */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-[32px] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-card/60 backdrop-blur-xl border-2 border-border/50 rounded-[28px] p-2 pr-4 shadow-2xl focus-within:border-primary/50 transition-colors">
            <div className="p-4 text-primary">
              <Star className="w-6 h-6" />
            </div>
            <Input
              placeholder="What's the next mission, Commander?"
              className="border-0 bg-transparent h-14 text-lg font-bold placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            />
            <Button
              onClick={handleAddTodo}
              className="rounded-2xl h-12 w-12 p-0 shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center">
              <Calendar className="w-4 h-4 mr-2" /> Daily Intel List
            </h3>
            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-[10px] font-black uppercase tracking-widest text-loss/60 hover:text-loss transition-colors flex items-center"
              >
                <RefreshCcw className="w-3 h-3 mr-1" /> Clear Completed
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
              </div>
            ) : todos.length === 0 ? (
              <div className="p-16 rounded-[40px] border-4 border-dashed border-border/40 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="p-6 rounded-full bg-accent/20">
                  <AlertCircle className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-widest">No Active Missions</h4>
                  <p className="text-sm font-bold italic">A blank list is a wasted opportunity. Add something.</p>
                </div>
              </div>
            ) : (
              todos.map((todo: Todo) => (
                <div
                  key={todo._id}
                  className={cn(
                    "group relative overflow-hidden transition-all duration-300 rounded-[24px] border-2",
                    todo.completed
                      ? "bg-accent/5 border-transparent opacity-60 pointer-events-none line-through scale-[0.98]"
                      : "bg-card border-border hover:border-primary/30 shadow-sm hover:shadow-xl hover:-translate-y-1"
                  )}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center space-x-5 flex-1 cursor-pointer" onClick={() => !todo.completed && handleToggleTodo(todo._id, todo.completed)}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTodo(todo._id, todo.completed);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all border-2 pointer-events-auto",
                          todo.completed
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                            : "border-border hover:border-primary"
                        )}
                      >
                        {todo.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-transparent" />}
                      </button>
                      <span className={cn("text-lg font-bold transition-all", !todo.completed && "text-foreground")}>
                        {todo.task}
                      </span>
                    </div>

                    {!todo.completed ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTodo(todo._id);
                          }}
                          className="rounded-xl h-10 w-10 text-muted-foreground hover:text-loss hover:bg-loss/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-auto"
                        >
                          <Trash2 className="w-5 h-5" />
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
              ))
            )}
          </div>
        </div>

        {/* Motivational Card */}
        {todos.length > 0 && progress < 100 && (
          <div className="p-8 rounded-[40px] bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 shadow-2xl flex items-center space-x-6">
            <div className="p-4 rounded-[28px] bg-primary/20 text-primary animate-pulse">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-1">Commander's Insight</h4>
              <p className="text-base text-muted-foreground font-bold leading-tight">
                "Small wings move great weight. Complete your next task and keep the momentum. The market rewards the disciplined."
              </p>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}