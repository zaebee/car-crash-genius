import React, { useRef, useState } from 'react';
import { Upload, Car, Loader2, X, AlertTriangle, ShieldCheck, FileText, Sparkles, Wind, ChevronDown, Check, Key, Plus } from 'lucide-react';
import { UploadedFile, AIModel } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const AVAILABLE_MODELS: AIModel[] = [
  { id: 'google-pro', name: 'Gemini 3 Pro', provider: 'google', description: 'Deep reasoning', badge: 'Best' },
  { id: 'google-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: 'High speed' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'mistral', description: 'Open weights' },
];

interface SidebarProps {
  onGenerate: (files: UploadedFile[], text: string) => void;
  isGenerating: boolean;
  hasAgenda: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
  mistralKey: string;
  onMistralKeyChange: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onGenerate, 
  isGenerating,
  hasAgenda,
  isOpen = true,
  onClose,
  selectedModel,
  onSelectModel,
  mistralKey,
  onMistralKeyChange
}) => {
  const { t } = useLanguage();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      newFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setFiles(prev => [...prev, {
                name: file.name,
                type: file.type,
                data: event.target?.result as string,
              }]);
            }
          };
          reader.readAsDataURL(file);
      });
      // Reset input to allow selecting same file again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (files.length === 0 && !textInput.trim()) return;
    onGenerate(files, textInput);
    if (window.innerWidth < 768 && onClose) {
       onClose();
    }
  };

  const getProviderIcon = (provider: string) => {
    return provider === 'google' ? <Sparkles size={16} className="text-blue-400" /> : <Wind size={16} className="text-yellow-400" />;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar Content */}
      <div className={`
        fixed md:relative top-0 left-0 h-full bg-slate-900 border-r border-slate-800 shadow-xl z-40 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out
        w-[85vw] md:w-72 lg:w-80
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Car size={18} />
              </div>
              {t.appTitle}
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">{t.appSubtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden text-slate-500 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Model Selector */}
          <div className="space-y-3 relative">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.selectModel}
            </label>
            <button 
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between hover:bg-slate-750 hover:border-slate-600 transition-all text-left"
            >
               <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700/50`}>
                     {getProviderIcon(selectedModel.provider)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{selectedModel.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-medium">{selectedModel.provider === 'google' ? t.providerGoogle : t.providerMistral}</div>
                  </div>
               </div>
               <ChevronDown size={16} className={`text-slate-500 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu */}
            {isModelDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)}></div>
                <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20 flex flex-col p-1 animate-in fade-in zoom-in-95 duration-200">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
                        selectedModel.id === model.id ? 'bg-slate-700/50' : 'hover:bg-slate-700/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-700/50 shrink-0">
                          {getProviderIcon(model.provider)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-sm font-medium ${selectedModel.id === model.id ? 'text-white' : 'text-slate-300'}`}>
                              {model.name}
                            </span>
                            {model.badge && (
                              <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{model.badge}</span>
                            )}
                         </div>
                         <p className="text-[10px] text-slate-500">{model.description}</p>
                      </div>
                      {selectedModel.id === model.id && <Check size={14} className="text-red-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Conditional API Key Input */}
          {selectedModel.provider === 'mistral' && (
            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Key size={12} />
                    {t.enterApiKey}
                </label>
                <input 
                    type="password"
                    value={mistralKey}
                    onChange={(e) => onMistralKeyChange(e.target.value)}
                    placeholder={t.apiKeyPlaceholder}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none placeholder:text-slate-600 transition-all"
                />
            </div>
          )}

          {/* File Upload Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t.sourceMaterial}
                </label>
                {files.length > 0 && (
                     <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                        {files.length} {t.filesAttached.toLowerCase()}
                     </span>
                )}
            </div>

            <div className="space-y-2">
                {/* File List */}
                {files.map((file, idx) => (
                    <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 flex items-center justify-between group hover:border-slate-600 transition-colors animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative">
                                {file.type.startsWith('image/') ? (
                                    <img src={file.data} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                    <FileText className="text-slate-400" size={20} />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm text-slate-200 truncate font-medium max-w-[140px]">{file.name}</span>
                                <span className="text-[10px] text-slate-500 uppercase">{file.type.split('/')[1] || 'FILE'}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleRemoveFile(idx)}
                            className="text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg p-1.5 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                {/* Drop Zone / Add Button */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed border-slate-700 bg-slate-800/30 rounded-xl p-4 flex items-center justify-center text-slate-400 hover:border-red-500 hover:text-red-400 hover:bg-slate-800 cursor-pointer transition-all group ${files.length > 0 ? 'h-16' : 'h-32 flex-col'}`}
                >
                    {files.length > 0 ? (
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Plus size={18} />
                            {t.addMore}
                        </div>
                    ) : (
                        <>
                            <Upload className="group-hover:scale-110 transition-transform mb-3" size={24} />
                            <span className="text-xs font-medium text-center whitespace-pre-line leading-relaxed">{t.dropFile}</span>
                        </>
                    )}
                </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple
              accept="image/png, image/jpeg, image/webp, application/pdf, text/plain"
              onChange={handleFileChange}
            />
          </div>

          {/* Text Input Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.additionalContext}
            </label>
            <textarea 
              className="w-full h-32 p-3 text-sm bg-slate-800 border border-slate-700 rounded-xl focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none resize-none transition-all placeholder:text-slate-600 text-slate-200"
              placeholder={t.contextPlaceholder}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleSubmit}
            disabled={isGenerating || (files.length === 0 && !textInput.trim())}
            className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg ${
              isGenerating || (files.length === 0 && !textInput.trim())
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-red-600/25 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                {t.generating}
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                {t.createAgenda}
              </>
            )}
          </button>
        </div>

        {hasAgenda && (
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <AlertTriangle size={14} className="text-amber-500" />
              {t.agendaReady}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;