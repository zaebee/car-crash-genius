import React from 'react';
import { ImageIcon, ArrowRight, FileText } from 'lucide-react';
import { UploadedFile } from '../../types';

interface EvidenceGalleryStripProps {
  files: UploadedFile[];
  onViewAll?: () => void;
  onPreview: (f: UploadedFile) => void;
  t: any;
}

const EvidenceGalleryStrip: React.FC<EvidenceGalleryStripProps> = ({ files, onViewAll, onPreview, t }) => {
    if (files.length === 0) return null;
    return (
        <div className="mt-6 pt-6 border-t border-slate-100" data-html2canvas-ignore="true">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ImageIcon size={14} />
                    {t.evidenceGallery}
                </h3>
                <button 
                    onClick={onViewAll}
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
                        onClick={() => file.type.startsWith('image/') && onPreview(file)}
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
    );
};

export default EvidenceGalleryStrip;