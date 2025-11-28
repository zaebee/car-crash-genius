import React from 'react';
import { CircleDollarSign, AlertOctagon } from 'lucide-react';

interface HeaderStatsProps {
  cost: string;
  count: number;
  t: any;
}

const HeaderStats: React.FC<HeaderStatsProps> = ({ cost, count, t }) => (
  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 w-full lg:w-64 shrink-0 mt-2 lg:mt-0">
    <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-colors">
      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-emerald-100 text-emerald-600 shadow-sm shrink-0">
         <CircleDollarSign size={20} />
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide truncate">{t.costEst}</p>
        <p className="font-bold text-slate-800 text-sm md:text-base truncate" title={cost}>
          {cost}
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-3 bg-rose-50/50 p-3 rounded-xl border border-rose-100 hover:border-rose-200 transition-colors">
      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-rose-100 text-rose-500 shadow-sm shrink-0">
          <AlertOctagon size={20} />
      </div>
      <div className="min-w-0 overflow-hidden">
        <p className="text-[9px] font-bold text-rose-600/70 uppercase tracking-wide truncate">{t.totalDuration}</p>
        <p className="font-bold text-slate-800 text-sm md:text-base truncate">
          {count} found
        </p>
      </div>
    </div>
  </div>
);

export default HeaderStats;