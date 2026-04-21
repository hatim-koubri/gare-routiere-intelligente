'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Phone, Mail, FileText, Code, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface AddCompagnieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export function AddCompagnieModal({ isOpen, onClose, onSubmit }: AddCompagnieModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    telephone: '',
    email: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ nom: '', code: '', telephone: '', email: '', description: '' });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl z-[101] px-4"
          >
            <div className="bg-white border border-emerald-900/5 rounded-[3rem] shadow-[0_30px_80px_rgba(6,78,59,0.15)] overflow-hidden">
              {/* Header */}
              <div className="bg-[#064e3b] p-10 text-white relative">
                 <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Register Partner</h2>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Network Expansion Protocol</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                        <X size={24} />
                    </button>
                 </div>
                 <Building2 size={160} className="absolute -right-16 -bottom-16 text-white/5 rotate-12" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 ml-1 italic">Company Name *</label>
                        <div className="relative">
                            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900/20" size={20} />
                            <input 
                                required
                                value={formData.nom}
                                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                placeholder="ex: CTM Express"
                                className="w-full bg-emerald-50/50 border border-emerald-900/5 rounded-2.5xl py-4.5 pl-14 pr-6 text-sm font-black text-emerald-950 focus:ring-4 focus:ring-emerald-950/5 focus:border-[#064e3b]/30 outline-none transition-all placeholder:text-emerald-900/10"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 ml-1 italic">Registry Code *</label>
                        <div className="relative">
                            <Code className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900/20" size={20} />
                            <input 
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                placeholder="ex: CTM-001"
                                className="w-full bg-emerald-50/50 border border-emerald-900/5 rounded-2.5xl py-4.5 pl-14 pr-6 text-sm font-black text-emerald-950 focus:ring-4 focus:ring-emerald-950/5 focus:border-[#064e3b]/30 outline-none transition-all placeholder:text-emerald-900/10"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 ml-1 italic">Contact Hotline</label>
                        <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900/20" size={20} />
                            <input 
                                type="tel"
                                value={formData.telephone}
                                onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                                placeholder="+212 ..."
                                className="w-full bg-emerald-50/50 border border-emerald-900/5 rounded-2.5xl py-4.5 pl-14 pr-6 text-sm font-black text-emerald-950 focus:ring-4 focus:ring-emerald-950/5 focus:border-[#064e3b]/30 outline-none transition-all placeholder:text-emerald-900/10"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 ml-1 italic">Network Email</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900/20" size={20} />
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="ops@company.com"
                                className="w-full bg-emerald-50/50 border border-emerald-900/5 rounded-2.5xl py-4.5 pl-14 pr-6 text-sm font-black text-emerald-950 focus:ring-4 focus:ring-emerald-950/5 focus:border-[#064e3b]/30 outline-none transition-all placeholder:text-emerald-900/10"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-900/40 ml-1 italic">Strategic Description</label>
                    <div className="relative">
                        <FileText className="absolute left-5 top-5 text-emerald-900/20" size={20} />
                        <textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe corporate role and operational mission..."
                            rows={3}
                            className="w-full bg-emerald-50/50 border border-emerald-900/5 rounded-[1.8rem] p-5 pl-14 text-sm font-black text-emerald-950 focus:ring-4 focus:ring-emerald-950/5 focus:border-[#064e3b]/30 outline-none transition-all resize-none placeholder:text-emerald-900/10"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <button 
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#064e3b] text-white font-black py-5 rounded-2.5xl shadow-[0_20px_40px_rgba(6,78,59,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase text-xs tracking-widest leading-none outline-none"
                    >
                        {loading ? "INITIALIZING..." : (
                            <>
                                <CheckCircle2 size={20} />
                                Confirm Registration
                            </>
                        )}
                    </button>
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-10 bg-emerald-50 text-emerald-800/40 font-black py-5 rounded-2.5xl hover:bg-emerald-100/50 hover:text-emerald-900 transition-all uppercase text-xs tracking-widest leading-none"
                    >
                        Abort
                    </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
