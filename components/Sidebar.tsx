import React, { useRef, useState } from 'react';
import { Upload, Car, Loader2, X, AlertTriangle, ShieldCheck, FileText, ImageIcon } from 'lucide-react';
import { UploadedFile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  onGenerate: (file: UploadedFile | null, text: string) => void;
  isGenerating: boolean;
  hasAgenda: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onGenerate, 
  isGenerating,
  hasAgenda,
  isOpen = true,
  onClose
}) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setFile({
            name: selectedFile.name,
            type: selectedFile.type,
            data: event.target.result as string,
          });
        }
      };
      
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!file && !textInput.trim()) return;
    onGenerate(file, textInput);
    if (window.innerWidth < 768 && onClose) {
       onClose();
    }
  };

  const renderFilePreview = () => {
    if (!file) return null;

    const isImage = file.type.startsWith('image/');

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between group hover:border-slate-600 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
              {isImage ? (
                <img src={file.data} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <FileText className="text-slate-400" size={20} />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-slate-200 truncate font-medium">{file.name}</span>
              <span className="text-[10px] text-slate-500 uppercase">{file.type.split('/')[1] || 'FILE'}</span>
            </div>
          </div>
          <button 
            onClick={handleRemoveFile}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>
    );
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
          {/* File Upload Section */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t.sourceMaterial}
            </label>
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-700 bg-slate-800/50 rounded-xl p-6 md:p-8 flex flex-col items-center justify-center text-slate-400 hover:border-red-500 hover:text-red-400 hover:bg-slate-800 cursor-pointer transition-all group"
              >
                <div className="flex gap-2 mb-3">
                    <Upload className="group-hover:scale-110 transition-transform" size={24} />
                </div>
                <span className="text-xs font-medium text-center whitespace-pre-line leading-relaxed">{t.dropFile}</span>
              </div>
            ) : renderFilePreview()}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
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
            disabled={isGenerating || (!file && !textInput.trim())}
            className={`w-full py-4 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg ${
              isGenerating || (!file && !textInput.trim())
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