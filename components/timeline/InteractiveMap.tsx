import React from 'react';
import { ScanEye } from 'lucide-react';
import { CrashAnalysisResult, UploadedFile } from '../../types';
import { getSeverityStyles } from '../../utils/uiUtils';

interface InteractiveMapProps {
    mainImage: UploadedFile | undefined;
    data: CrashAnalysisResult;
    expandedIndex: number | null;
    hoveredIndex: number | null;
    setExpandedIndex: (index: number | null) => void;
    setHoveredIndex: (index: number | null) => void;
    handleBoxClick: (index: number) => void;
    t: any;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
    mainImage,
    data,
    expandedIndex,
    hoveredIndex,
    setExpandedIndex,
    setHoveredIndex,
    handleBoxClick,
    t
}) => {
    if (!mainImage) return null;

    const renderBoundingBoxes = () => {
        return (data.damagePoints || []).map((item, index) => {
          if (!item.boundingBox || item.boundingBox.length !== 4) return null;
          const [ymin, xmin, ymax, xmax] = item.boundingBox;
          const styles = getSeverityStyles(item.severity);
          const isActive = expandedIndex === index;
          const isHovered = hoveredIndex === index;
    
          return (
            <div
              key={index}
              onClick={(e) => { e.stopPropagation(); handleBoxClick(index); }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`absolute cursor-pointer transition-all duration-300 group z-10 ${isActive ? 'z-20 scale-105' : ''}`}
              style={{
                top: `${ymin / 10}%`,
                left: `${xmin / 10}%`,
                width: `${(xmax - xmin) / 10}%`,
                height: `${(ymax - ymin) / 10}%`,
                border: `2px solid ${styles.boxBorder}`,
                backgroundColor: isActive || isHovered ? styles.boxColor : 'transparent',
                boxShadow: isActive || isHovered ? `0 0 10px ${styles.boxBorder}` : 'none'
              }}
            >
              <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 transition-opacity pointer-events-none ${isActive || isHovered ? 'opacity-100' : ''}`}>
                 {item.partName}
              </div>
              {(isActive || isHovered) && (
                  <div className={`absolute top-0 right-0 w-2 h-2 ${styles.bar} rounded-full animate-ping opacity-75`}></div>
              )}
            </div>
          );
        });
    };

    return (
        <div className="mb-6 bg-slate-900 rounded-2xl p-1 overflow-hidden shadow-lg" data-html2canvas-ignore="true">
            <div className="bg-slate-900 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <ScanEye size={18} className="text-red-500" />
                    <span className="text-sm font-bold uppercase tracking-wider">{t.interactiveMap}</span>
                </div>
                <span className="text-[10px] text-slate-400">Click highlighted areas to focus cards</span>
            </div>
            <div className="relative w-full bg-black rounded-xl overflow-hidden group">
                <img src={mainImage.data} alt="Analysis" className="w-full h-auto object-contain max-h-[500px] mx-auto opacity-80 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 max-h-[500px] mx-auto w-full" onClick={() => setExpandedIndex(null)}>
                    {renderBoundingBoxes()}
                </div>
            </div>
        </div>
    );
};

export default InteractiveMap;