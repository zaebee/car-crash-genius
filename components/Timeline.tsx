import React from 'react';
import { CircleDollarSign, Wrench, AlertOctagon, CarFront, ChevronRight, Activity, ArrowRight } from 'lucide-react';
import { CrashAnalysisResult } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TimelineProps {
  data: CrashAnalysisResult;
  onTopicClick?: (topic: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ data, onTopicClick }) => {
  const { t } = useLanguage();

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'bg-red-500',
        bar: 'bg-red-500'
      };
      case 'high': return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: 'bg-orange-500',
        bar: 'bg-orange-500'
      };
      case 'medium': return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: 'bg-amber-500',
        bar: 'bg-amber-500'
      };
      default: return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: 'bg-green-500',
        bar: 'bg-green-500'
      };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700 pb-24 md:pb-12">
      {/* Dashboard Header */}
      <div className="mb-8 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between relative z-10">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
              {data.title}
            </h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-3xl">
              {data.summary}
            </p>
            
            {/* Vehicles Tags */}
            <div className="mt-6 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-2">
                  <CarFront size={14} />
                  {t.attendees}
              </span>
              {data.vehiclesInvolved.map((vehicle, idx) => (
                  <span 
                      key={idx} 
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                  >
                      {vehicle}
                  </span>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-row lg:flex-col gap-4 shrink-0 w-full lg:w-72">
            <div className="flex-1 flex items-center gap-4 bg-emerald-50/50 px-5 py-4 rounded-xl border border-emerald-100/60 transition-transform hover:scale-[1.02]">
              <div className="p-2.5 bg-white rounded-xl border border-emerald-100 text-emerald-600 shadow-sm">
                 <CircleDollarSign size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wide mb-0.5">{t.costEst}</p>
                <p className="font-bold text-slate-800 text-base md:text-lg">{data.estimatedRepairCostRange}</p>
              </div>
            </div>
            
            <div className="flex-1 flex items-center gap-4 bg-rose-50/50 px-5 py-4 rounded-xl border border-rose-100/60 transition-transform hover:scale-[1.02]">
              <div className="p-2.5 bg-white rounded-xl border border-rose-100 text-rose-500 shadow-sm">
                  <AlertOctagon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wide mb-0.5">{t.totalDuration}</p>
                <p className="font-bold text-slate-800 text-base md:text-lg">{data.damagePoints.length} found</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout for Damage Points */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
            <div className="p-1.5 bg-red-100 text-red-600 rounded-lg">
                <Activity size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Damage Points</h2>
            <span className="text-sm font-medium text-slate-400 ml-auto hidden sm:block">
                Click cards for AI details
            </span>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
          {data.damagePoints.map((item, index) => {
            const styles = getSeverityStyles(item.severity);
            return (
              <div 
                key={index} 
                onClick={() => onTopicClick?.(`${t.tellMeMore} "${item.partName} - ${item.damageType}"`)}
                className="group bg-white rounded-2xl border border-slate-200 p-0 shadow-sm hover:shadow-lg hover:border-red-200 transition-all cursor-pointer relative overflow-hidden flex flex-col h-full"
              >
                <div className="flex flex-1 items-stretch">
                    {/* Severity Indicator Strip */}
                    <div className={`w-1.5 ${styles.bar}`}></div>
                    
                    <div className="flex-1 p-5 md:p-6 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${styles.bg} ${styles.text} ${styles.border}`}>
                                    {item.severity}
                                </span>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                                    {item.partName}
                                </h3>
                            </div>
                            <span className="self-start sm:self-auto text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-md">
                               {item.damageType}
                            </span>
                        </div>
                        
                        <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                            {item.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <div className="flex items-center gap-2">
                                <Wrench size={14} className="text-slate-400" />
                                <span className="text-xs font-bold text-slate-400 uppercase mr-1">{t.action}:</span>
                                <span className="text-sm font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                    {item.recommendedAction}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs font-semibold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                                Ask AI <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;