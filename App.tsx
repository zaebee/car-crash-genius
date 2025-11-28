
import React, { useState, useEffect } from 'react';
import Sidebar, { AVAILABLE_MODELS } from './components/Sidebar';
import Timeline from './components/Timeline';
import ChatInterface from './components/ChatInterface';
import EvidenceView from './components/EvidenceView';
import { CrashAnalysisResult, UploadedFile, AIModel, TonWalletState } from './types';
import { generateCrashReport } from './services/geminiService';
import { LayoutDashboard, PanelRightOpen, PanelRightClose, Globe, Car, ShieldCheck, Menu, FileText } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { initTonConnect } from './services/tonService';

const App: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [meetingData, setMeetingData] = useState<CrashAnalysisResult | null>(null);
  const [currentFiles, setCurrentFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuery, setSuggestedQuery] = useState<string>('');
  const [activeView, setActiveView] = useState<'analysis' | 'evidence'>('analysis');
  
  // Model & Key State
  const [selectedModel, setSelectedModel] = useState<AIModel>(AVAILABLE_MODELS[0]);
  const [mistralKey, setMistralKey] = useState<string>('');

  // Wallet State
  const [walletState, setWalletState] = useState<TonWalletState>({
    isConnected: false,
    address: null,
    rawAddress: null
  });

  useEffect(() => {
    // Initialize TON Connect on mount
    initTonConnect((wallet) => {
      setWalletState(wallet);
    });
  }, []);

  const handleGenerate = async (files: UploadedFile[], text: string) => {
    setIsGenerating(true);
    setError(null);
    setCurrentFiles(files);
    setMeetingData(null); // Clear previous
    setActiveView('analysis');
    setIsSidebarOpen(false); // Close sidebar on mobile after submit
    
    try {
      const data = await generateCrashReport(files, text, language, selectedModel, mistralKey);
      setMeetingData(data);
      // On desktop open chat automatically, on mobile keep closed to show report first
      if (window.innerWidth >= 768) {
        setIsChatOpen(true);
      }
    } catch (err: any) {
      console.error(err);
      
      // Prefer specific error messages from the service
      if (err.message && (
          err.message.includes("API Key") ||
          err.message.includes("quota") ||
          err.message.includes("limit") ||
          err.message.includes("Network") ||
          err.message.includes("unavailable") ||
          err.message.includes("supported") ||
          err.message.includes("MISTRAL_NOT_CONFIGURED")
      )) {
         setError(err.message === "MISTRAL_NOT_CONFIGURED" ? "Mistral API Key is required." : err.message);
      } else {
         setError(t.failedError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setCurrentFiles(prev => [...prev, ...newFiles]);
  };

  const handleTopicClick = (query: string) => {
    setSuggestedQuery(query);
    setIsChatOpen(true); // Ensure chat is open to receive query
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  const navigateToEvidence = () => {
    if (meetingData) {
        setActiveView('evidence');
        setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar (Left) */}
      <Sidebar 
        onGenerate={handleGenerate} 
        isGenerating={isGenerating}
        hasAgenda={!!meetingData}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        mistralKey={mistralKey}
        onMistralKeyChange={setMistralKey}
        onLogoClick={navigateToEvidence}
        wallet={walletState}
      />

      {/* Main Content (Center) */}
      <div className="flex-1 flex flex-col relative overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <header className="h-14 md:h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center px-4 md:px-6 justify-between shrink-0 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4">
             {/* Mobile Menu Button */}
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
             >
               <Menu size={20} />
             </button>

             <div className="flex items-center gap-2 text-slate-500 text-xs md:text-sm font-medium">
                <div 
                  onClick={navigateToEvidence}
                  className={`flex items-center gap-1.5 ${meetingData ? 'cursor-pointer hover:text-slate-800 transition-colors' : ''}`}
                >
                    <LayoutDashboard size={16} className="hidden md:block" />
                    <span className="hidden md:inline">{t.workspace}</span>
                </div>
                {meetingData && (
                    <>
                      <span className="hidden md:inline text-slate-300">/</span>
                      <span 
                        className={`font-semibold truncate max-w-[150px] md:max-w-xs cursor-pointer hover:underline ${activeView === 'analysis' ? 'text-red-600' : 'text-slate-600'}`}
                        onClick={() => setActiveView('analysis')}
                      >
                        {meetingData.title}
                      </span>
                    </>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
              title="Switch Language"
            >
              <Globe size={16} />
              {language}
            </button>

            {meetingData && (
              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                  isChatOpen 
                    ? 'bg-red-50 text-red-600' 
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {isChatOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                <span className="hidden sm:inline">{isChatOpen ? t.hideAssistant : t.showAssistant}</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 scroll-smooth">
          {!meetingData && !isGenerating && !error && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-24 h-24 bg-white border border-slate-200 rounded-3xl flex items-center justify-center mb-6 shadow-sm relative overflow-hidden group cursor-pointer hover:border-red-200 transition-all" onClick={() => setIsSidebarOpen(true)}>
                 <div className="absolute inset-0 bg-red-50/50 group-hover:bg-red-50 transition-colors"></div>
                 <Car size={48} className="text-red-400 relative z-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 text-center">{t.readyToBuild}</h2>
              <p className="text-slate-500 mt-2 max-w-md text-center leading-relaxed text-sm md:text-base">
                {t.readyDescription}
              </p>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="mt-6 md:hidden px-6 py-2 bg-red-600 text-white rounded-lg font-medium shadow-lg shadow-red-600/20"
              >
                Upload Evidence
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mt-6">{t.analyzing}</h2>
              <p className="text-slate-500 mt-2">{t.identifying}</p>
            </div>
          )}

          {error && (
            <div className="h-full flex flex-col items-center justify-center text-red-500 p-8">
              <p className="font-medium bg-red-50 px-6 py-4 rounded-xl border border-red-100 shadow-sm flex items-center gap-2">
                <ShieldCheck size={20} />
                {error}
              </p>
            </div>
          )}

          {meetingData && !isGenerating && (
            <>
              {activeView === 'analysis' ? (
                <Timeline 
                    data={meetingData} 
                    onTopicClick={handleTopicClick} 
                    files={currentFiles} 
                    onViewAllEvidence={() => setActiveView('evidence')}
                    wallet={walletState}
                />
              ) : (
                <EvidenceView files={currentFiles} onAddFiles={handleAddFiles} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Chat Panel (Right) - Collapsible / Mobile Overlay */}
      {meetingData && (
        <>
            {/* Mobile Chat Overlay Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300 ${
                    isChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsChatOpen(false)}
            />
            
            <div 
            className={`
                fixed md:relative top-0 right-0 h-full bg-white shadow-2xl md:shadow-xl z-30 
                border-l border-slate-200 transition-transform duration-300 ease-in-out
                w-[90vw] md:w-[400px] 
                ${isChatOpen ? 'translate-x-0' : 'translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:opacity-0'}
            `}
            >
            <div className="h-full w-full md:w-[400px]"> {/* Fixed width container */}
                <ChatInterface 
                    initialData={meetingData} 
                    files={currentFiles} 
                    suggestedQuery={suggestedQuery}
                    selectedModel={selectedModel}
                    mistralKey={mistralKey}
                />
            </div>
            </div>
        </>
      )}
    </div>
  );
};

export default App;