
import React, { useState, useRef, useEffect } from 'react';
import { CircleDollarSign, Wrench, AlertOctagon, CarFront, ChevronRight, Activity, ArrowRight, Maximize2, X, Image as ImageIcon, Download, Loader2, AlertTriangle, CheckCircle2, AlertCircle, FileText, ScanEye, Calendar, HardDrive, Camera, Aperture, Clock, Zap, Wallet, BadgeCheck, Lock, ExternalLink, Hash, Database, FileCheck, ChevronDown } from 'lucide-react';
import { CrashAnalysisResult, UploadedFile, DamageItem, TonWalletState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { sendTransaction, connectWallet, generateReportHash } from '../services/tonService';

interface TimelineProps {
  data: CrashAnalysisResult;
  files: UploadedFile[];
  onTopicClick?: (topic: string) => void;
  onViewAllEvidence?: () => void;
  wallet: TonWalletState;
}

type CertStep = 'idle' | 'hashing' | 'ipfs' | 'signing' | 'minting' | 'success' | 'failed';

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

  // Identify the main image (first image in the list) to be used for overlay
  const mainImage = files.find(f => f.type.startsWith('image/'));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleBoxClick = (index: number) => {
    setExpandedIndex(index === expandedIndex ? null : index);
    const card = cardRefs.current[index];
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    // If not connected, open wallet modal
    if (!wallet.isConnected) {
        connectWallet();
        return;
    }

    try {
        // Step 1: Hashing Report Data
        setCertStep('hashing');
        const contentHash = await generateReportHash(data);
        await new Promise(r => setTimeout(r, 800)); // Simulate processing

        // Step 2: Simulate IPFS Upload
        setCertStep('ipfs');
        // In a real app, you would upload the JSON to IPFS/Pinata here
        const mockIpfsCid = "Qm" + contentHash.substring(0, 44); 
        setIpfsHash(mockIpfsCid);
        await new Promise(r => setTimeout(r, 1000)); 

        // Step 3: Wallet Signature & Transaction
        setCertStep('signing');
        // 0.05 TON Fee
        const resultBoc = await sendTransaction("0.05", `Certify: ${mockIpfsCid}`);
        
        if (resultBoc) {
            setCertStep('minting');
            // Simulate blockchain confirmation time
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

  const getStepLabel = () => {
      switch(certStep) {
          case 'hashing': return t.stepHashing;
          case 'ipfs': return t.stepIpfs;
          case 'signing': return t.stepSign;
          case 'minting': return t.stepMint;
          case 'failed': return t.paymentFailed;
          default: return t.confirming;
      }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        bar: 'bg-red-600',
        hoverBorder: 'hover:border-red-400',
        shadow: 'hover:shadow-red-100',
        icon: <AlertTriangle size={16} className="text-red-700" />,
        boxColor: 'rgba(239, 68, 68, 0.4)',
        boxBorder: '#ef4444'
      };
      case 'high': return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        bar: 'bg-orange-600',
        hoverBorder: 'hover:border-orange-400',
        shadow: 'hover:shadow-orange-100',
        icon: <AlertCircle size={16} className="text-orange-700" />,
        boxColor: 'rgba(249, 115, 22, 0.4)',
        boxBorder: '#f97316'
      };
      case 'medium': return {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-200',
        bar: 'bg-amber-500',
        hoverBorder: 'hover:border-amber-400',
        shadow: 'hover:shadow-amber-100',
        icon: <Activity size={16} className="text-amber-700" />,
        boxColor: 'rgba(245, 158, 11, 0.4)',
        boxBorder: '#f59e0b'
      };
      case 'low':
      default: return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        bar: 'bg-emerald-500',
        hoverBorder: 'hover:border-emerald-400',
        shadow: 'hover:shadow-emerald-100',
        icon: <CheckCircle2 size={16} className="text-emerald-700" />,
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
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1280 }, 
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
      setIsExporting(false);
    }
  };

  const renderBoundingBoxes = () => {
    if (!mainImage) return null;

    return data.damagePoints.map((item, index) => {
      if (!item.boundingBox || item.boundingBox.length !== 4) return null;
      
      const [ymin, xmin, ymax, xmax] = item.boundingBox;
      const top = ymin / 10;
      const left = xmin / 10;
      const height = (ymax - ymin) / 10;
      const width = (xmax - xmin) / 10;
      
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
            top: `${top}%`,
            left: `${left}%`,
            width: `${width}%`,
            height: `${height}%`,
            border: `2px solid ${styles.boxBorder}`,
            backgroundColor: isActive || isHovered ? styles.boxColor : 'transparent',
            boxShadow: isActive || isHovered ? `0 0 10px ${styles.boxBorder}` : 'none'
          }}
        >
          <div className={`
             absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded 
             whitespace-nowrap opacity-0 transition-opacity pointer-events-none
             ${isActive || isHovered ? 'opacity-100' : ''}
          `}>
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
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-700 pb-24 md:pb-12">
      <div id="report-content">
        {/* Dashboard Header */}
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
        
          {/* Identified Vehicles Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <CarFront size={14} />
                {t.identifiedVehicles}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
               {/* Prioritize identifiedVehicles if available, fallback to vehiclesInvolved */}
               {data.identifiedVehicles ? (
                   data.identifiedVehicles.map((vehicle, idx) => (
                       <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 items-start">
                           <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
                              <CarFront size={20} className="text-slate-400" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 text-sm truncate">{vehicle.make} {vehicle.model}</div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span className="bg-white border border-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600">
                                     {vehicle.year}
                                  </span>
                                  {vehicle.color}
                              </div>
                              <div className="mt-2 text-xs font-mono bg-slate-200/50 text-slate-600 px-2 py-1 rounded w-fit border border-slate-200">
                                 {vehicle.licensePlate !== 'Unknown' && vehicle.licensePlate !== 'Not Visible' ? (
                                    <span className="font-bold text-slate-800">{vehicle.licensePlate}</span>
                                 ) : (
                                    <span className="italic opacity-75">{vehicle.licensePlate}</span>
                                 )}
                              </div>
                           </div>
                       </div>
                   ))
               ) : (
                   data.vehiclesInvolved.map((vehicle, idx) => (
                    <span 
                        key={idx} 
                        className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                        {vehicle}
                    </span>
                   ))
               )}
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100" data-html2canvas-ignore="true">
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
                            onClick={() => file.type.startsWith('image/') && setPreviewFile(file)}
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
                    <div className="absolute inset-0 max-h-[500px] mx-auto w-full" onClick={() => setExpandedIndex(null)}>
                       {renderBoundingBoxes()}
                    </div>
                </div>
             </div>
        )}

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
              const isExpanded = expandedIndex === index;
              const isHovered = hoveredIndex === index;
              
              return (
                <div 
                  key={index}
                  ref={(el) => { cardRefs.current[index] = el; }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className={`group bg-white rounded-2xl border p-0 shadow-sm transition-all cursor-pointer relative overflow-hidden flex flex-col h-full break-inside-avoid duration-300
                    ${isExpanded || isHovered ? `ring-2 ring-offset-2 ${styles.border.replace('border-', 'ring-')}` : 'border-slate-200'}
                    ${styles.hoverBorder} ${styles.shadow}
                  `}
                >
                  <div className="flex flex-1 items-stretch">
                      {/* Thicker, more prominent sidebar */}
                      <div className={`w-3 sm:w-5 flex-shrink-0 ${styles.bar}`}></div>
                      
                      <div className="flex-1 p-4 md:p-6 flex flex-col">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                              <div className="flex items-center gap-2.5">
                                  {/* Enhanced badge */}
                                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5 ${styles.bg} ${styles.text} ${styles.border} shadow-sm`}>
                                      {styles.icon}
                                      {item.severity}
                                  </span>
                                  <h3 className="text-base md:text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors leading-tight">
                                      {item.partName}
                                  </h3>
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-100 px-2 py-1 rounded-md">
                                   {item.damageType}
                                </span>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                          </div>
                          
                          {/* Accordion Content */}
                          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                             <div className="overflow-hidden">
                                  <p className="text-slate-600 text-sm leading-relaxed mb-5 mt-2 animate-in fade-in duration-500">
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onTopicClick?.(`${t.tellMeMore} "${item.partName} - ${item.damageType}"`);
                                        }}
                                        className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                                        data-html2canvas-ignore="true"
                                      >
                                          Ask AI <ArrowRight size={14} />
                                      </button>
                                  </div>
                             </div>
                          </div>
                          
                          {/* Collapsed Preview */}
                          {!isExpanded && (
                             <p className="text-slate-500 text-sm leading-relaxed mt-2 line-clamp-2">
                                {item.description}
                             </p>
                          )}
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smart Contract Interaction Footer */}
      <div className="mt-12 mb-8" data-html2canvas-ignore="true">
        {certStep === 'success' ? (
             // Success Certificate Card
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-500">
                <div className="absolute -top-12 -right-12 text-slate-700/20 rotate-12">
                     <FileCheck size={250} />
                </div>
                <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="bg-green-500/20 p-2 rounded-lg backdrop-blur-sm border border-green-500/50">
                            <CheckCircle2 size={24} className="text-green-400" />
                        </div>
                        <div>
                             <h3 className="text-2xl font-bold text-white tracking-tight">{t.certificateTitle}</h3>
                             <p className="text-slate-400 text-sm">{t.paymentSuccess}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-6">
                         <div className="space-y-1">
                             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                 <Hash size={12} /> {t.certId}
                             </div>
                             <div className="font-mono text-xs md:text-sm text-blue-300 truncate" title={txHash}>{txHash}</div>
                         </div>
                         <div className="space-y-1">
                             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                 <Database size={12} /> {t.ipfsHash}
                             </div>
                             <div className="font-mono text-xs md:text-sm text-purple-300 truncate" title={ipfsHash}>{ipfsHash}</div>
                         </div>
                     </div>

                     <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                         <div className="flex items-center gap-1.5 bg-green-900/30 px-3 py-1.5 rounded-full border border-green-500/30 text-green-300">
                             <BadgeCheck size={14} /> {t.rewardNote}
                         </div>
                         <button className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer">
                             {t.explorerLink} <ExternalLink size={12} />
                         </button>
                     </div>
                </div>
             </div>
        ) : (
            // Interaction Card
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <BadgeCheck size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <BadgeCheck size={24} className="text-white" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold">{t.premiumCert}</h3>
                    </div>
                    <p className="text-blue-100 max-w-xl mb-6 leading-relaxed">
                        {t.certifyDesc}
                    </p>
                    
                    <button 
                        onClick={handleCertify}
                        disabled={certStep !== 'idle' && certStep !== 'failed'}
                        className="flex items-center gap-3 bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed min-w-[200px] justify-center"
                    >
                        {certStep !== 'idle' && certStep !== 'failed' ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                {getStepLabel()}
                            </>
                        ) : (
                            <>
                                <Wallet size={20} />
                                {wallet.isConnected ? t.certifyReport : t.connectWallet}
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded ml-1">{t.priceTon}</span>
                            </>
                        )}
                    </button>
                    {certStep === 'failed' && (
                        <div className="mt-3 flex items-center gap-2 text-red-200 bg-red-900/20 px-3 py-1.5 rounded-lg w-fit">
                            <AlertCircle size={16} />
                            <span className="text-sm font-semibold">{t.paymentFailed}</span>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

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
                        <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-semibold uppercase">
                            <FileText size={12} />
                            Filename
                        </div>
                        <div className="text-sm font-medium truncate" title={previewFile.name}>
                            {previewFile.name}
                        </div>
                    </div>
                     <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-semibold uppercase">
                            <HardDrive size={12} />
                            {t.fileSize}
                        </div>
                        <div className="text-sm font-medium">
                            {formatFileSize(previewFile.size)}
                        </div>
                    </div>
                    <div className="col-span-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-semibold uppercase">
                            <Calendar size={12} />
                            {t.dateModified}
                        </div>
                        <div className="text-sm font-medium">
                            {new Date(previewFile.lastModified).toLocaleString()}
                        </div>
                    </div>
                </div>
                {previewFile.exif && (
                  <>
                    <div className="flex items-center gap-2 mt-4 mb-3 text-white/80 text-xs font-bold uppercase tracking-wider border-b border-white/10 pb-2">
                        <Camera size={14} />
                        {t.cameraInfo}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {(previewFile.exif.make || previewFile.exif.model) && (
                            <div className="col-span-2 space-y-1">
                                <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-semibold uppercase">
                                    <Camera size={12} />
                                    {t.cameraModel}
                                </div>
                                <div className="text-sm font-medium">
                                    {previewFile.exif.make} {previewFile.exif.model}
                                </div>
                            </div>
                        )}
                        {(previewFile.exif.fNumber || previewFile.exif.exposureTime || previewFile.exif.iso) && (
                             <div className="col-span-2 space-y-1">
                                <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-semibold uppercase">
                                    <Aperture size={12} />
                                    {t.cameraSettings}
                                </div>
                                <div className="flex gap-3 text-sm font-medium">
                                    {previewFile.exif.fNumber && (
                                        <span className="bg-white/10 px-1.5 py-0.5 rounded">{previewFile.exif.fNumber}</span>
                                    )}
                                    {previewFile.exif.exposureTime && (
                                        <span className="bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Clock size={10} /> {previewFile.exif.exposureTime}s
                                        </span>
                                    )}
                                    {previewFile.exif.iso && (
                                        <span className="bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Zap size={10} /> ISO {previewFile.exif.iso}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;
