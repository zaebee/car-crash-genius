
import React, { useRef, useState } from 'react';
import { UploadedFile } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { FileText, Image as ImageIcon, Maximize2, Plus, Upload, X } from 'lucide-react';
import { processFile } from '../services/fileProcessing';

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const processedFiles: UploadedFile[] = [];
      
      for (const file of newFiles) {
        try {
            const uploadedFile = await processFile(file);
            processedFiles.push(uploadedFile);
        } catch (error) {
            console.error("Error processing file", file.name, error);
        }
      }
      
      onAddFiles(processedFiles);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t.caseEvidence}</h1>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors active:scale-95"
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
            <div className="bg-slate-100 p-4 rounded-full mb-4">
               <Upload className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-500 font-medium">{t.noEvidence}</p>
         </div>
      ) : (
        <div className="space-y-10">
            {/* Photos Section */}
            {images.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <ImageIcon className="text-red-500" size={20} />
                        {t.visualEvidence}
                        <span className="text-sm font-normal text-slate-400 ml-auto bg-slate-100 px-2 py-0.5 rounded-full">{images.length}</span>
                    </h2>
                    {/* Masonry-like Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {images.map((file, idx) => (
                            <div 
                                key={idx}
                                onClick={() => setPreviewImage(file.data)}
                                className="group relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300"
                            >
                                <img src={file.data} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                    <Maximize2 className="text-white drop-shadow-md transform scale-75 group-hover:scale-100 transition-transform" size={28} />
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                    <p className="text-white text-xs truncate font-medium">{file.name}</p>
                                    <p className="text-white/70 text-[10px] uppercase mt-0.5">{Math.round(file.size / 1024)} KB</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Documents Section */}
            {docs.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <FileText className="text-blue-500" size={20} />
                        {t.documents}
                         <span className="text-sm font-normal text-slate-400 ml-auto bg-slate-100 px-2 py-0.5 rounded-full">{docs.length}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'application/pdf' ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500'}`}>
                                    <FileText size={24} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800 truncate text-sm" title={file.name}>{file.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[10px] text-slate-500 uppercase font-bold bg-slate-100 px-1.5 py-0.5 rounded">{file.type.split('/')[1] || 'DOC'}</span>
                                       <span className="text-[10px] text-slate-400">{Math.round(file.size / 1024)} KB</span>
                                    </div>
                                </div>
                                {/* Mock download/view action */}
                                <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Maximize2 size={16} />
                                </button>
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
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
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
