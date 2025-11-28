import React from 'react';
import { BadgeCheck, Loader2, Wallet, AlertCircle, FileCheck, CheckCircle2, Hash, Database, ExternalLink } from 'lucide-react';
import { TonWalletState } from '../../types';

export type CertStep = 'idle' | 'hashing' | 'ipfs' | 'signing' | 'minting' | 'success' | 'failed';

interface CertificationSectionProps {
    certStep: CertStep;
    txHash: string;
    ipfsHash: string;
    wallet: TonWalletState;
    handleCertify: () => void;
    t: any;
}

const CertificationSection: React.FC<CertificationSectionProps> = ({ certStep, txHash, ipfsHash, wallet, handleCertify, t }) => {
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

    if (certStep === 'success') {
        return (
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
        );
    }

    return (
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
    );
};

export default CertificationSection;