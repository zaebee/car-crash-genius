import React, { useState } from 'react';
import { CircleDollarSign, Wrench, AlertOctagon, CarFront, ChevronRight, Activity, ArrowRight, Maximize2, X, Image as ImageIcon, Download, Loader2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { CrashAnalysisResult, UploadedFile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TimelineProps {
  data: CrashAnalysisResult;
  file: UploadedFile | null;
  onTopicClick?: (topic: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ data, file, onTopicClick }) => {
  const { t } = useLanguage();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        bar: 'bg-red-500',
        hoverBorder: 'hover:border-red-300',
        shadow: 'hover:shadow-red-100',
        icon: <AlertTriangle size={12} className="text-red-600" />
      };
      case 'high': return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        bar: 'bg-orange-500',
        hoverBorder: 'hover:border-orange-300',
        shadow: 'hover:shadow-orange-100',
        icon: <AlertCircle size={12} className="text-orange-600" />
      };
      case 'medium': return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        bar: 'bg-amber-500',
        hoverBorder: 'hover:border-amber-300',
        shadow: 'hover:shadow-amber-100',
        icon: <Activity size={12} className="text-amber-600" />
      };
      case 'low':
      default: return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        bar: 'bg-emerald-500',
        hoverBorder: 'hover:border-emerald-300',
        shadow: 'hover:shadow-emerald-100',
        icon: <CheckCircle2 size={12} className="text-emerald-600" />
      };
    }
  };

  const isImageFile = file?.type.startsWith('image/');

  const handleExportPdf = () => {
    setIsExporting(true);
    const element = document.getElementById('report-content');
    const opt = {
      margin: [10, 10],
      filename: `Crash-Report-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
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

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700 pb-24 md:pb-12">
      <div id="report-content">
        {/* Dashboard Header */}
        <div className="mb-8 bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">
                    {data.title}
                  </h1>
                  
                  {/* PDF Export Button (Hidden in PDF via data-html2canvas-ignore) */}
                  <button 
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    data-html2canvas-ignore="true"
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    <span className="hidden sm:inline">{t.exportPdf}</span>
                  </button>
              </div>

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
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <Activity size={18} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Damage Points</h2>
              <span className="text-sm font-medium text-slate-400 ml-auto hidden sm:block" data-html2canvas-ignore="true">
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
                  className={`group bg-white rounded-2xl border border-slate-200 p-0 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden flex flex-col h-full break-inside-avoid ${styles.hoverBorder} ${styles.shadow}`}
                >
                  <div className="flex flex-1 items-stretch">
                      {/* Severity Indicator Strip */}
                      <div className={`w-1.5 ${styles.bar}`}></div>
                      
                      <div className="flex-1 p-5 md:p-6 flex flex-col">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                              <div className="flex items-center gap-3">
                                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${styles.bg} ${styles.text} ${styles.border}`}>
                                      {styles.icon}
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

                          <div className="flex items-end justify-between pt-4 border-t border-slate-50 mt-auto">
                              <div className="flex flex-col gap-3">
                                  <div className="flex items-center gap-2">
                                      <Wrench size={14} className="text-slate-400" />
                                      <span className="text-xs font-bold text-slate-400 uppercase mr-1">{t.action}:</span>
                                      <span className="text-sm font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                          {item.recommendedAction}
                                      </span>
                                  </div>
                                  {/* Image Thumbnail Section */}
                                  {isImageFile && file?.data && (
                                    <div 
                                      className="flex items-center gap-2 group/thumb"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewImage(file.data);
                                      }}
                                    >
                                      <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in">
                                        <img src={file.data} alt="Evidence" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/10 transition-colors flex items-center justify-center">
                                           <Maximize2 size={12} className="text-white opacity-0 group-hover/thumb:opacity-100 drop-shadow-md" />
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider group-hover/thumb:text-red-500 transition-colors" data-html2canvas-ignore="true">
                                        {t.sourceMaterial}
                                      </span>
                                    </div>
                                  )}
                              </div>
                              
                              <div className="flex items-center gap-1 text-xs font-semibold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300 mb-2" data-html2canvas-ignore="true">
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
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;