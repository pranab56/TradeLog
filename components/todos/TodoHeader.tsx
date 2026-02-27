"use client";

import { Progress } from "@/components/ui/progress";
import { Target, Zap } from 'lucide-react';

interface TodoHeaderProps {
  progress: number;
}

export default function TodoHeader({ progress }: TodoHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-primary ">Operation: Discipline</h1>
        <p className="font-normal flex items-center text-sm">
          <Target className="w-4 h-4 mr-2 text-primary" />
          Success is the sum of small, repeated actions.
        </p>
      </div>
      <div className="bg-card border border-border p-4 px-6 rounded-xl shadow-xl flex items-center space-x-6 min-w-[500px]">
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
  );
}
