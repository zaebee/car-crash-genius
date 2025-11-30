
import React, { useRef, useEffect } from 'react';
import { Wrench, ChevronDown, Sparkles } from 'lucide-react';
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
            // Optional auto-scroll behavior could go here
        }
    }, [isExpanded]);

    return (
        <div 
          id={`damage-card-${index}`}
          ref={cardRef}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={onToggle}
          className={`group bg-white rounded-xl border shadow-sm transition-all cursor-pointer relative overflow-hidden flex flex-col break-inside-avoid duration-300 touch-manipulation
            ${isExpanded || isHovered ? `ring-1 ring-offset-0 ${styles.border.replace('border-', 'ring-')} shadow-md scale-[1.01]` : 'border-slate-200'}
            ${styles.hoverBorder}
          `}
        >
            <div className="flex h-full">
                {/* Slim colored accent strip */}
                <div className={`w-1 flex-shrink-0 ${styles.bar}`}></div>

                <div className="flex-1 p-3 md:p-4 flex flex-col min-w-0">
                    
                    {/* Header: Title & Chevron */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                         <h3 className="text-sm md:text-base font-bold text-slate-800 group-hover:text-red-600 transition-colors leading-snug pt-0.5 break-words">
                            {item.partName}
                        </h3>
                        <ChevronDown size={16} className={`text-slate-400 shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Metadata Row: Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                         <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles.bg} ${styles.text} ${styles.border}`}>
                            {React.cloneElement(styles.icon as React.ReactElement<any>, { size: 12 })}
                            {item.severity}
                         </div>
                         <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.damageType}
                         </span>
                    </div>

                    {/* Description - Collapsible */}
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                             <p className="text-slate-600 text-sm leading-relaxed mb-4 break-words">
                                 {item.description}
                             </p>

                             {/* Footer Actions */}
                             <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
                                 <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 max-w-full min-w-0">
                                     <Wrench size={14} className="text-slate-400 shrink-0" />
                                     <span className="text-xs font-medium text-slate-700 truncate">
                                         {item.recommendedAction}
                                     </span>
                                 </div>
                                 
                                 <button 
                                   onClick={(e) => {
                                       e.stopPropagation();
                                       onAskAI();
                                   }}
                                   className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors ml-auto whitespace-nowrap"
                                 >
                                     <Sparkles size={14} />
                                     Ask AI
                                 </button>
                             </div>
                        </div>
                    </div>

                    {/* Preview Text (Only when collapsed) */}
                    {!isExpanded && (
                       <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mt-1 break-words">
                          {item.description}
                       </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DamageCard;