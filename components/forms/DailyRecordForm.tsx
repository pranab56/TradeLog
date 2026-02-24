"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const schema = z.object({
  date: z.string().nonempty('Date is required'),
  profit: z.preprocess((val) => (val === "" ? 0 : Number(val)), z.number().min(0)),
  loss: z.preprocess((val) => (val === "" ? 0 : Number(val)), z.number().min(0)),
  riskRewardRatio: z.string().regex(/^\d+:\d+$/, 'Format must be 1:3'),
  notes: z.string().nonempty('Notes are mandatory'),
  tags: z.string().nonempty('At least one tag is mandatory'),
}).refine(data => {
  // Mutually exclusive validation
  return (data.profit > 0 && data.loss === 0) || (data.loss > 0 && data.profit === 0) || (data.profit === 0 && data.loss === 0);
}, {
  message: "Provide either Profit or Loss, not both.",
  path: ["profit"]
});

interface DailyRecordFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function DailyRecordForm({ initialData, onSubmit, isLoading }: DailyRecordFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      profit: initialData?.profit || 0,
      loss: initialData?.loss || 0,
      riskRewardRatio: initialData?.riskRewardRatio || '1:3',
      notes: initialData?.notes || '',
      tags: initialData?.tags?.join(', ') || '',
    }
  });

  const profitValue = watch('profit');
  const lossValue = watch('loss');

  // Multi-exclusivity logic: Disable other field when one is entered
  useEffect(() => {
    if (profitValue > 0) {
      // If profit is entered, we don't necessarily set loss to 0 here to avoid interfering with user typing
      // but the validation handles the block. 
      // To be "robust" as requested, we can disable the other.
    }
  }, [profitValue, lossValue, setValue]);

  const handleFormSubmit = (data: any) => {
    const formattedData = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()) : []
    };
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            Date <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            {...register('date')}
            className="w-full bg-accent/20 border border-border p-3.5 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
          {errors.date && <p className="text-destructive text-xs mt-1">{errors.date.message as string}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold flex items-center gap-2 text-primary">
            Risk Reward Ratio (e.g. 1:3) <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="1:3"
            {...register('riskRewardRatio')}
            className="w-full bg-primary/5 border border-primary/20 p-3.5 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-center"
          />
          {errors.riskRewardRatio && <p className="text-destructive text-xs mt-1">{errors.riskRewardRatio.message as string}</p>}
        </div>

        <div className="space-y-2 relative">
          <label className="text-sm font-semibold flex items-center gap-2 text-profit">
            Profit Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            disabled={lossValue > 0}
            {...register('profit')}
            placeholder="0.00"
            className="w-full bg-profit/5 border border-profit/20 p-3.5 rounded-xl focus:ring-2 focus:ring-profit/20 outline-none font-bold text-profit disabled:opacity-50 disabled:grayscale transition-all"
          />
          {lossValue > 0 && (
            <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground flex items-center gap-1">
              <Info size={12} /> Loss entered
            </div>
          )}
        </div>

        <div className="space-y-2 relative">
          <label className="text-sm font-semibold flex items-center gap-2 text-loss">
            Loss Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            disabled={profitValue > 0}
            {...register('loss')}
            placeholder="0.00"
            className="w-full bg-loss/5 border border-loss/20 p-3.5 rounded-xl focus:ring-2 focus:ring-loss/20 outline-none font-bold text-loss disabled:opacity-50 disabled:grayscale transition-all"
          />
          {profitValue > 0 && (
            <div className="absolute right-3 bottom-3 text-[10px] text-muted-foreground flex items-center gap-1">
              <Info size={12} /> Profit entered
            </div>
          )}
        </div>
      </div>

      {errors.profit && !errors.loss && (
        <p className="text-destructive text-xs font-medium text-center">{errors.profit.message as string}</p>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold">Tags (at least one) <span className="text-destructive">*</span></label>
        <input
          type="text"
          placeholder="Gold, Scalp, High-Vol"
          {...register('tags')}
          className="w-full bg-accent/20 border border-border p-3.5 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
        />
        {errors.tags && <p className="text-destructive text-xs mt-1">{errors.tags.message as string}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Trade Execution Notes <span className="text-destructive">*</span></label>
        <textarea
          rows={4}
          {...register('notes')}
          className="w-full bg-accent/20 border border-border p-4 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none"
          placeholder="Explain your entry, exit and psychological state..."
        />
        {errors.notes && <p className="text-destructive text-xs mt-1">{errors.notes.message as string}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary text-primary-foreground py-4.5 cursor-pointer rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale mt-2"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </div>
        ) : initialData ? 'Update Record' : 'Commit Single Record'}
      </button>
    </form>
  );
}
