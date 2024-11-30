import { Sparkles } from 'lucide-react';

export const AIBadge = () => {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 border border-violet-200 rounded-full text-xs font-medium text-violet-700">
      <Sparkles className="w-3 h-3" />
      <span>AI</span>
    </div>
  );
};