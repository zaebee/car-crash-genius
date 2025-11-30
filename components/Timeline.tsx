import React, { useState, useMemo } from 'react';
import { Download, Loader2, Activity, X, ImageIcon } from 'lucide-react';
import { CrashAnalysisResult, UploadedFile, TonWalletState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { sendTransaction, connectWallet, generateReportHash } from '../services/tonService';
import { getSeverityStyles } from '../utils/uiUtils';

// Sub-components
import HeaderStats from './timeline/HeaderStats';
import VehicleList from './timeline/VehicleList';
import EvidenceGalleryStrip from './timeline/EvidenceGalleryStrip';
import DamageCard from './timeline/DamageCard';
import CertificationSection, { CertStep } from './timeline/CertificationSection';
import InteractiveMap from './timeline/InteractiveMap';

interface TimelineProps {
  data: CrashAnalysisResult;
  files: UploadedFile[];
  onTopicClick?: (topic: string) => void;
  onViewAllEvidence?: () => void;
  wallet: TonWalletState;
}

const Timeline: React.FC<TimelineProps> = ({ data, files, onTopicClick, onViewAllEvidence, wallet }) => {
  const { t } = useLanguage();
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Interaction State
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // Certification State
  const [certStep, setCertStep] = useState<CertStep>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [ipfsHash, setIpfsHash] = useState<string>('');

  // Derived State
  const mainImage = useMemo(() => files.find(f => f.type.startsWith('image/')), [files]);
  
  const handleBoxClick = (index: number) => {
    setExpandedIndex(index === expandedIndex ? null : index);
    const element = document.getElementById(`damage-card-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCertify = async () => {
    if (!wallet.isConnected) {
        connectWallet();
        return;
    }
    try {
        setCertStep('hashing');
        const contentHash = await generateReportHash(data);
        await new Promise(r => setTimeout(r, 800)); 
        setCertStep('ipfs');
        const mockIpfsCid = "Qm" + contentHash.substring(0, 44); 
        setIpfsHash(mockIpfsCid);
        await new Promise(r => setTimeout(r, 1000)); 
        setCertStep('signing');
        const resultBoc = await sendTransaction("0.05", `Certify: ${mockIpfsCid}`);
        if (resultBoc) {
            setCertStep('minting');
            await new Promise(r => setTimeout(r, 2000)); 
            setTxHash(resultBoc.substring(0, 12) + "..." + resultBoc.substring(resultBoc.length - 4));
            setCertStep('success');
        } else {
            setCertStep('failed');
            setTimeout(() => setCertStep('idle'), 3000);
        }
    } catch (e) {
        console.error("Certification Error", e);
        setCertStep('failed');
        setTimeout(() => setCertStep('idle'), 3000);
    }
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    const element = document.getElementById('report-content');
    const opt = {
      margin: [10, 10],
      filename: `Crash-Report-${data.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1280 }, 
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => setIsExporting(false)).catch(() => setIsExporting(false));
    } else {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700 pb-24 md:pb-12">
      <div id="report-content">
        <div className="mb-6 md:mb-8 bg-white rounded-2xl p-5 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row gap-6 lg:items-start justify-between relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                    {data.title}
                  </h1>
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
            </div>
            
            <HeaderStats cost={data.estimatedRepairCostRange} count={(data.damagePoints || []).length} t={t} />
          </div>
        
          <VehicleList vehicles={data.vehiclesInvolved} identified={data.identifiedVehicles} t={t} />
          
          <EvidenceGalleryStrip 
              files={files} 
              t={t} 
              onViewAll={onViewAllEvidence} 
              onPreview={setPreviewFile} 
          />
        </div>

        <InteractiveMap 
            mainImage={mainImage}
            data={data}
            expandedIndex={expandedIndex}
            hoveredIndex={hoveredIndex}
            setExpandedIndex={setExpandedIndex}
            setHoveredIndex={setHoveredIndex}
            handleBoxClick={handleBoxClick}
            t={t}
        />

        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 px-1">
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                  <Activity size={18} />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800">{t.damageVisualization}</h2>
          </div>
          
          {/* Adjusted grid gap for new card style */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
            {(data.damagePoints || []).map((item, index) => (
                <DamageCard 
                    key={index}
                    index={index}
                    item={item}
                    isExpanded={expandedIndex === index}
                    isHovered={hoveredIndex === index}
                    onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    onHover={() => setHoveredIndex(index)}
                    onLeave={() => setHoveredIndex(null)}
                    onAskAI={() => onTopicClick?.(`${t.tellMeMore} "${item.partName} - ${item.damageType}"`)}
                    t={t}
                />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 mb-8" data-html2canvas-ignore="true">
          <CertificationSection 
              certStep={certStep} 
              txHash={txHash} 
              ipfsHash={ipfsHash} 
              wallet={wallet} 
              handleCertify={handleCertify} 
              t={t} 
          />
      </div>

      {/* Lightbox Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewFile(null)}
        >
          <button 
            onClick={() => setPreviewFile(null)}
            className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md border border-white/10"
          >
            <X size={24} />
          </button>
          
          <div className="relative max-w-5xl w-full flex flex-col items-center">
             <img 
                src={previewFile.data} 
                alt="Full size evidence" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} 
            />
            
            <div 
                className="mt-6 w-full max-w-lg mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-white shadow-xl animate-in slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 mb-3 text-white/80 text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                    <ImageIcon size={14} />
                    {t.fileDetails}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                         <div className="text-white/50 text-[10px] font-semibold uppercase">{t.documents}</div>
                         <div className="text-sm font-medium truncate">{previewFile.name}</div>
                    </div>
                    <div className="space-y-1">
                         <div className="text-white/50 text-[10px] font-semibold uppercase">{t.fileSize}</div>
                         <div className="text-sm font-medium">{formatFileSize(previewFile.size)}</div>
                    </div>
                </div>
                {previewFile.exif && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-3 gap-2">
                          {previewFile.exif.fNumber && <div className="text-center bg-white/5 rounded p-2"><div className="text-[9px] text-white/50 uppercase">Aperture</div><div className="font-mono">{previewFile.exif.fNumber}</div></div>}
                          {previewFile.exif.exposureTime && <div className="text-center bg-white/5 rounded p-2"><div className="text-[9px] text-white/50 uppercase">Shutter</div><div className="font-mono">{previewFile.exif.exposureTime}s</div></div>}
                          {previewFile.exif.iso && <div className="text-center bg-white/5 rounded p-2"><div className="text-[9px] text-white/50 uppercase">ISO</div><div className="font-mono">{previewFile.exif.iso}</div></div>}
                      </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;