import React, { useRef, useState } from 'react';
import { UploadedFile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { FileText, Image as ImageIcon, Maximize2, Plus, Upload, X } from 'lucide-react';

interface EvidenceViewProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
}

const EvidenceView: React.FC<EvidenceViewProps> = ({ files, onAddFiles }) => {
  const { t } = useLanguage();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = files.filter(f => f.type.startsWith('image/'));
  const docs = files.filter(f => !f.type.startsWith('image/'));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const processedFiles: UploadedFile[] = [];
      
      let processedCount = 0;
      newFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              processedFiles.push({
                name: file.name,
                type: file.type,
                data: event.target?.result as string,
              });
            }
            processedCount++;
            if (processedCount === newFiles.length) {
                onAddFiles(processedFiles);
            }
          };
          reader.readAsDataURL(file);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{t.caseEvidence}</h1>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t.uploadAdditional}</span>
        </button>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple
            accept="image/png, image/jpeg, image/webp, application/pdf, text/plain"
            onChange={handleFileChange}
        />
      </div>

      {files.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Upload className="text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">{t.noEvidence}</p>
         </div>
      ) : (
        <div className="space-y-8">
            {/* Photos Section */}
            {images.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <ImageIcon className="text-red-500" size={20} />
                        {t.visualEvidence}
                        <span className="text-sm font-normal text-slate-400 ml-2">({images.length})</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((file, idx) => (
                            <div 
                                key={idx}
                                onClick={() => setPreviewImage(file.data)}
                                className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-sm hover:shadow-md transition-all"
                            >
                                <img src={file.data} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all" size={24} />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                    <p className="text-white text-xs truncate font-medium">{file.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Documents Section */}
            {docs.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="text-blue-500" size={20} />
                        {t.documents}
                        <span className="text-sm font-normal text-slate-400 ml-2">({docs.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText size={24} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800 truncate" title={file.name}>{file.name}</p>
                                    <p className="text-xs text-slate-500 uppercase font-medium mt-0.5">{file.type.split('/')[1] || 'DOC'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
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

export default EvidenceView;