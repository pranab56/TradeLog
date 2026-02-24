"use client";

import { IDailyRecord } from '@/models/DailyRecord';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const schema = z.object({
  date: z.string().nonempty('Date is required'),
  profit: z.number().min(0, 'Must be positive'),
  loss: z.number().min(0, 'Must be positive'),
  totalTrades: z.number().int().min(0),
  winningTrades: z.number().int().min(0),
  losingTrades: z.number().int().min(0),
  riskRewardRatio: z.number().min(0),
  notes: z.string().optional(),
  tags: z.string().optional(), // Will split by comma
});

interface DailyRecordFormProps {
  initialData?: Partial<IDailyRecord>;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function DailyRecordForm({ initialData, onSubmit, isLoading }: DailyRecordFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      profit: initialData?.profit || 0,
      loss: initialData?.loss || 0,
      totalTrades: initialData?.totalTrades || 0,
      winningTrades: initialData?.winningTrades || 0,
      losingTrades: initialData?.losingTrades || 0,
      riskRewardRatio: initialData?.riskRewardRatio || 0,
      notes: initialData?.notes || '',
      tags: initialData?.tags?.join(', ') || '',
    }
  });

  const handleFormSubmit = (data: any) => {
    const formattedData = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : []
    };
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            {...register('date')}
            className="w-full bg-accent/30 border border-border p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
          />
          {errors.date && <p className="text-loss text-xs">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Risk Reward Ratio</label>
          <input
            type="number"
            step="0.01"
            {...register('riskRewardRatio', { valueAsNumber: true })}
            className="w-full bg-accent/30 border border-border p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Profit ($)</label>
          <input
            type="number"
            {...register('profit', { valueAsNumber: true })}
            className="w-full bg-profit/5 border border-profit/20 p-3 rounded-xl focus:ring-2 focus:ring-profit/20 outline-none font-bold text-profit"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Loss ($)</label>
          <input
            type="number"
            {...register('loss', { valueAsNumber: true })}
            className="w-full bg-loss/5 border border-loss/20 p-3 rounded-xl focus:ring-2 focus:ring-loss/20 outline-none font-bold text-loss"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Tags (comma separated)</label>
        <input
          type="text"
          placeholder="scalp, swing, FOMO, reversal"
          {...register('tags')}
          className="w-full bg-accent/30 border border-border p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Trading Journal / Notes</label>
        <textarea
          rows={4}
          {...register('notes')}
          className="w-full bg-accent/30 border border-border p-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
          placeholder="What went well? What could be improved?"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-4 cursor-pointer rounded-2xl font-bold shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Daily Record'}
      </button>
    </form>
  );
}
