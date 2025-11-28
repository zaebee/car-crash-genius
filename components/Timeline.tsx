import React, { useState, useRef, useEffect } from 'react';
import { CircleDollarSign, Wrench, AlertOctagon, CarFront, ChevronRight, Activity, ArrowRight, Maximize2, X, Image as ImageIcon, Download, Loader2, AlertTriangle, CheckCircle2, AlertCircle, FileText, ScanEye } from 'lucide-react';
import { CrashAnalysisResult, UploadedFile, DamageItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TimelineProps {
  data: CrashAnalysisResult;
  files: UploadedFile[];
  onTopicClick?: (topic: string) => void;
  onViewAllEvidence?: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ data, files, onTopicClick, onViewAllEvidence }) => {
  const { t } = useLanguage();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeDamageIndex, setActiveDamageIndex] = useState<number | null>(null);

  // Identify the main image (first image in the list) to be used for overlay
  const mainImage = files.find(f => f.type.startsWith('image/'));

  // Scroll logic for cards
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleBoxClick = (index: number) => {
    setActiveDamageIndex(index);
    // Scroll to card
    const card = cardRefs.current[index];
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        bar: 'bg-red-500',
        hoverBorder: 'hover:border-red-300',
        shadow: 'hover:shadow-red-100',
        icon: <AlertTriangle size={12} className="text-red-600" />,
        boxColor: 'rgba(239, 68, 68, 0.4)',
        boxBorder: '#ef4444'
      };
      case 'high': return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        bar: 'bg-orange-500',
        hoverBorder: 'hover:border-orange-300',
        shadow: 'hover:shadow-orange-100',
        icon: <AlertCircle size={12} className="text-orange-600" />,
        boxColor: 'rgba(249, 115, 22, 0.4)',
        boxBorder: '#f97316'
      };
      case 'medium': return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        bar: 'bg-amber-500',
        hoverBorder: 'hover:border-amber-300',
        shadow: 'hover:shadow-amber-100',
        icon: <Activity size={12} className="text-amber-600" />,
        boxColor: 'rgba(245, 158, 11, 0.4)',
        boxBorder: '#f59e0b'
      };
      case 'low':
      default: return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        bar: 'bg-emerald-500',
        hoverBorder: 'hover:border-emerald-300',
        shadow: 'hover:shadow-emerald-100',
        icon: <CheckCircle2 size={12} className="text-emerald-600" />,
        boxColor: 'rgba(16, 185, 129, 0.4)',
        boxBorder: '#10b981'
      };
    }
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    const element = document.getElementById('report-content');
    const opt = {
      margin: [10, 10],
      filename: `Crash-Report-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1280 }, // Force desktop width
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsExporting(false);
      }).catch((err: any) => {
        console.error("PDF Export Error", err);
        setIsExporting(false);
      });
    } else {
      console.error("html2pdf library not found");
      setIsExporting(false);
    }
  };

  // Render bounding box overlay
  const renderBoundingBoxes = () => {
    if (!mainImage) return null;

    return data.damagePoints.map((item, index) => {
      if (!item.boundingBox || item.boundingBox.length !== 4) return null;
      
      const [ymin, xmin, ymax, xmax] = item.boundingBox;
      const top = ymin / 10; // Convert 0-1000 to percentage
      const left = xmin / 10;
      const height = (ymax - ymin) / 10;
      const width = (xmax - xmin) / 10;
      
      const styles = getSeverityStyles(item.severity);
      const isActive = activeDamageIndex === index;

      return (
        <div
          key={index}
          onClick={() => handleBoxClick(index)}
          className={`absolute cursor-pointer transition-all duration-300 group z-10 ${isActive ? 'z-20 scale-105' : ''}`}
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${width}%`,
            height: `${height}%`,
            border: `2px solid ${styles.boxBorder}`,
            backgroundColor: isActive ? styles.boxColor : 'transparent',
            boxShadow: isActive ? `0 0 10px ${styles.boxBorder}` : 'none'
          }}
        >
          {/* Label Tooltip */}
          <div className={`
             absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded 
             whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
             ${isActive ? 'opacity-100' : ''}
          `}>
             {item.partName}
          </div>
          
          {/* Pulsing corner for discovery */}
          <div className={`absolute top-0 right-0 w-2 h-2 ${styles.bar} rounded-full animate-ping opacity-75`}></div>
        </div>
      );
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700 pb-24 md:pb-12">
      <div id="report-content">
        {/* Dashboard Header */}
        <div className="mb-6 md:mb-8 bg-white rounded-2xl p-5 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row gap-6 lg:items-start justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    {data.title}
                  </h1>
                  
                  {/* PDF Export Button */}
                  <button 
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    data-html2canvas-ignore="true"
                    className="shrink-0 flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={18} />}
                    <span className="hidden sm:inline">{t.exportPdf}</span>
                  </button>
              </div>

              <p className="text-slate-600 text-sm md:text-lg leading-relaxed max-w-3xl mb-5">
                {data.summary}
              </p>
              
              {/* Vehicles Tags */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mr-1">
                    <CarFront size={14} />
                    {t.attendees}
                </span>
                {data.vehiclesInvolved.map((vehicle, idx) => (
                    <span 
                        key={idx} 
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs md:text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                        {vehicle}
                    </span>
                ))}
              </div>
            </div>

            {/* Compact Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 w-full lg:w-64 shrink-0 mt-2 lg:mt-0">
              <div className="flex items-center gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-colors">
                <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-emerald-100 text-emerald-600 shadow-sm shrink-0">
                   <CircleDollarSign size={20} />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide truncate">{t.costEst}</p>
                  <p className="font-bold text-slate-800 text-sm md:text-base truncate" title={data.estimatedRepairCostRange}>
                    {data.estimatedRepairCostRange}
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
                    {data.damagePoints.length} found
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Gallery Strip */}
          {files.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100" data-html2canvas-ignore="true">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <ImageIcon size={14} />
                        {t.evidenceGallery}
                    </h3>
                    <button 
                        onClick={onViewAllEvidence}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                        {t.viewFullGallery}
                        <ArrowRight size={14} />
                    </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {files.map((file, idx) => (
                        <div 
                            key={idx}
                            onClick={() => file.type.startsWith('image/') && setPreviewImage(file.data)}
                            className={`relative w-16 h-16 shrink-0 rounded-lg border border-slate-200 overflow-hidden group cursor-pointer ${!file.type.startsWith('image/') ? 'bg-slate-50 flex flex-col items-center justify-center p-1' : ''}`}
                        >
                            {file.type.startsWith('image/') ? (
                                <img src={file.data} alt="evidence" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                                <FileText size={20} className="text-slate-400" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* Interactive Damage Map Section */}
        {mainImage && (
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
                    <div className="absolute inset-0 max-h-[500px] mx-auto w-full">
                       {renderBoundingBoxes()}
                    </div>
                </div>
             </div>
        )}

        {/* Grid Layout for Damage Points */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 px-1">
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <Activity size={18} />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">{t.damageVisualization}</h2>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {data.damagePoints.map((item, index) => {
              const styles = getSeverityStyles(item.severity);
              const isActive = activeDamageIndex === index;
              return (
                <div 
                  key={index}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  onMouseEnter={() => setActiveDamageIndex(index)}
                  onMouseLeave={() => setActiveDamageIndex(null)}
                  onClick={() => onTopicClick?.(`${t.tellMeMore} "${item.partName} - ${item.damageType}"`)}
                  className={`group bg-white rounded-2xl border p-0 shadow-sm transition-all cursor-pointer relative overflow-hidden flex flex-col h-full break-inside-avoid duration-300
                    ${isActive ? `ring-2 ring-offset-2 ${styles.border.replace('border-', 'ring-')}` : 'border-slate-200'}
                    ${styles.hoverBorder} ${styles.shadow}
                  `}
                >
                  <div className="flex flex-1 items-stretch">
                      {/* Severity Indicator Strip */}
                      <div className={`w-1.5 ${styles.bar}`}></div>
                      
                      <div className="flex-1 p-4 md:p-6 flex flex-col">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                              <div className="flex items-center gap-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1 ${styles.bg} ${styles.text} ${styles.border}`}>
                                      {styles.icon}
                                      {item.severity}
                                  </span>
                                  <h3 className="text-base md:text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors leading-tight">
                                      {item.partName}
                                  </h3>
                              </div>
                              <span className="self-start sm:self-auto text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-md">
                                 {item.damageType}
                              </span>
                          </div>
                          
                          <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
                              {item.description}
                          </p>

                          <div className="flex items-end justify-between pt-4 border-t border-slate-50 mt-auto">
                              <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-2">
                                      <Wrench size={14} className="text-slate-400" />
                                      <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mr-1">{t.action}:</span>
                                      <span className="text-xs md:text-sm font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                          {item.recommendedAction}
                                      </span>
                                  </div>
                              </div>
                              
                              <button 
                                className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                                data-html2canvas-ignore="true"
                              >
                                  Ask AI <ArrowRight size={14} />
                              </button>
                          </div>
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={previewImage} 
            alt="Full size evidence" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;