import React, { useRef, useEffect } from 'react';
import { Wrench, ChevronDown, ArrowRight } from 'lucide-react';
import { DamageItem } from '../../types';
import { getSeverityStyles } from '../../utils/uiUtils';

interface DamageCardProps {
    item: DamageItem;
    index: number;
    isExpanded: boolean;
    isHovered: boolean;
    onToggle: () => void;
    onHover: () => void;
    onLeave: () => void;
    onAskAI: () => void;
    t: any;
}

const DamageCard: React.FC<DamageCardProps> = ({ 
    item, 
    index, 
    isExpanded, 
    isHovered, 
    onToggle, 
    onHover, 
    onLeave, 
    onAskAI,
    t
}) => {
    const styles = getSeverityStyles(item.severity);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isExpanded && cardRef.current) {
             // Optional auto-scroll behavior could be added here
        }
    }, [isExpanded]);

    return (
        <div 
          id={`damage-card-${index}`}
          ref={cardRef}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={onToggle}
          className={`group bg-white rounded-2xl border p-0 shadow-sm transition-all cursor-pointer relative overflow-hidden flex flex-col h-full break-inside-avoid duration-300 touch-manipulation active:scale-[0.99]
            ${isExpanded || isHovered ? `ring-2 ring-offset-2 ${styles.border.replace('border-', 'ring-')}` : 'border-slate-200'}
            ${styles.hoverBorder} ${styles.shadow}
          `}
        >
          <div className="flex flex-1 items-stretch">
              <div className={`w-4 flex-shrink-0 ${styles.bar}`}></div>
              
              <div className="flex-1 p-4 md:p-6 flex flex-col">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                      <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-wide border flex items-center gap-2 ${styles.bg} ${styles.text} ${styles.border} shadow-sm`}>
                              {React.cloneElement(styles.icon as React.ReactElement<any>, { size: 18 })}
                              {item.severity}
                          </span>
                          <h3 className="text-lg md:text-xl font-bold text-slate-800 group-hover:text-red-600 transition-colors leading-tight">
                              {item.partName}
                          </h3>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-2.5 py-1 rounded-md">
                           {item.damageType}
                        </span>
                        <div className="p-1 -mr-1">
                            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                  </div>
                  
                  {/* Content - Mobile Readability Optimized */}
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                     <div className="overflow-hidden">
                          <p className="text-slate-600 text-base md:text-sm leading-relaxed mb-5 mt-2 animate-in fade-in duration-500">
                              {item.description}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-4 border-t border-slate-50 mt-auto gap-4">
                              <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-3">
                                      <Wrench size={16} className="text-slate-400" />
                                      <span className="text-xs font-bold text-slate-400 uppercase">{t.action}:</span>
                                      <span className="text-sm font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                          {item.recommendedAction}
                                      </span>
                                  </div>
                              </div>
                              
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAskAI();
                                }}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-3 sm:py-2 rounded-xl sm:rounded-full transition-colors active:bg-red-200"
                                data-html2canvas-ignore="true"
                              >
                                  Ask AI <ArrowRight size={16} />
                              </button>
                          </div>
                     </div>
                  </div>
                  
                  {!isExpanded && (
                     <p className="text-slate-500 text-sm leading-relaxed mt-2 line-clamp-2">
                        {item.description}
                     </p>
                  )}
              </div>
          </div>
        </div>
    );
};

export default DamageCard;