'use client';

import { useState } from 'react';
import { offlineApi } from '@/lib/api/offline';
import {
  Download, WifiOff, Map, CheckCircle2, Save, Calendar, FileText, FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';

function HorairesSection() {
  const [jours, setJours] = useState(7);
  const [loading, setLoading] = useState<'json' | 'pdf' | 'excel' | 'save' | null>(null);
  const [message, setMessage] = useState('');
  const cached = offlineApi.hasOfflineHoraires(jours);

  const handleDownload = async (format: 'json' | 'pdf' | 'excel') => {
    setLoading(format);
    setMessage('');
    try {
      if (format === 'json') await offlineApi.downloadHoraires(jours);
      else if (format === 'pdf') await offlineApi.downloadHorairesPDF(jours);
      else await offlineApi.downloadHorairesExcel(jours);
      setMessage('Téléchargement terminé !');
    } catch {
      setMessage('Erreur lors du téléchargement');
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSave = async () => {
    setLoading('save');
    setMessage('');
    try {
      await offlineApi.saveHorairesOffline(jours);
      setMessage('Horaires sauvegardés hors ligne !');
    } catch {
      setMessage('Erreur lors de la sauvegarde');
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const btnClass = 'flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition disabled:opacity-50';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Calendar size={20} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Horaires hors ligne</h3>
          <p className="text-xs text-slate-500">Téléchargez les horaires pour les consulter sans connexion</p>
        </div>
        {cached && <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} />En cache</span>}
      </div>
      <div className="w-32 mb-4">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Jours</label>
        <input type="number" min={1} max={30} value={jours} onChange={e => setJours(parseInt(e.target.value) || 7)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => handleDownload('pdf')} disabled={loading !== null} className={clsx(btnClass, 'bg-red-600 text-white hover:bg-red-700')}>
          <FileText size={15} /> {loading === 'pdf' ? '...' : 'PDF'}
        </button>
        <button onClick={() => handleDownload('excel')} disabled={loading !== null} className={clsx(btnClass, 'bg-emerald-600 text-white hover:bg-emerald-700')}>
          <FileSpreadsheet size={15} /> {loading === 'excel' ? '...' : 'Excel'}
        </button>
        <button onClick={() => handleDownload('json')} disabled={loading !== null} className={clsx(btnClass, 'bg-indigo-600 text-white hover:bg-indigo-700')}>
          <Download size={15} /> {loading === 'json' ? '...' : 'JSON'}
        </button>
        <button onClick={handleSave} disabled={loading !== null} className={clsx(btnClass, 'bg-slate-700 text-white hover:bg-slate-800')}>
          <Save size={15} /> {loading === 'save' ? '...' : 'Sauvegarder offline'}
        </button>
      </div>
      {message && (
        <div className={clsx('mt-3 p-2.5 rounded-xl text-sm font-medium', message.includes('Erreur') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')}>{message}</div>
      )}
    </div>
  );
}

function PlanGareSection() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <Map size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Plan de la gare</h3>
          <p className="text-xs text-slate-500">Plan d&apos;ensemble de la gare routière avec les quais et infrastructures</p>
        </div>
      </div>

      <div id="plan-gare-container" className="bg-slate-900 rounded-xl p-4 overflow-auto">
        <svg id="plan-gare-svg" viewBox="0 0 900 580" className="w-full max-w-4xl mx-auto" xmlns="http://www.w3.org/2000/svg" style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="url(#grid)" />
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="1" />
            </pattern>
            <pattern id="grass" width="30" height="30" patternUnits="userSpaceOnUse">
              <rect width="30" height="30" fill="#064e3b" />
              {Array.from({ length: 8 }).map((_, i) => (
                <line key={i} x1={i * 8 % 30} y1={i * 10 % 30} x2={i * 8 % 30 + 3} y2={i * 10 % 30 - 5} stroke="#065f46" strokeWidth="1" />
              ))}
            </pattern>
            <pattern id="asphalt" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="#334155" />
              <circle cx="3" cy="3" r="0.8" fill="#3b4a5a" />
              <circle cx="8" cy="7" r="0.6" fill="#3b4a5a" />
            </pattern>
            <pattern id="zebra" width="40" height="12" patternUnits="userSpaceOnUse">
              <rect width="40" height="12" fill="#475569" />
              <rect x="0" y="0" width="20" height="12" fill="#e2e8f0" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect width="900" height="580" fill="url(#grid-major)" />
          <rect x="0" y="0" width="900" height="48" fill="#0f172a" opacity="0.9" />
          <text x="450" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="14" fontWeight="bold" letterSpacing="4">PLAN DE LA GARE ROUTIERE</text>
          <rect x="30" y="60" width="840" height="480" rx="8" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,4" />
          <rect x="60" y="80" width="780" height="160" rx="6" fill="url(#asphalt)" />
          <text x="450" y="100" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" letterSpacing="3">ZONE QUAIS</text>

          {[
            { num: 1, x: 70, y: 115, label: 'CTM' },
            { num: 2, x: 175, y: 115, label: 'Supratours' },
            { num: 3, x: 280, y: 115, label: 'Ghazala' },
            { num: 4, x: 385, y: 115, label: 'SATAS' },
            { num: 5, x: 490, y: 115, label: 'Q5' },
            { num: 6, x: 595, y: 115, label: 'Q6' },
            { num: 7, x: 700, y: 115, label: 'Q7' },
            { num: 8, x: 705, y: 195, label: 'Q8' },
          ].map(q => {
            const w = q.num === 8 ? 100 : 94;
            const h = 68;
            const fill = q.num <= 4 ? '#1e3a5f' : '#1a2e4a';
            const accent = q.num <= 4 ? '#3b82f6' : '#64748b';
            return (
              <g key={q.num}>
                <rect x={q.x} y={q.y} width={w} height={h} rx={4} fill={fill} stroke={accent} strokeWidth={1.5} />
                <rect x={q.x} y={q.y} width={w} height={18} rx={4} fill={accent} />
                <rect x={q.x} y={q.y + 14} width={w} height={4} fill={accent} />
                <text x={q.x + w / 2} y={q.y + 12} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold" letterSpacing={1}>Q{q.num}</text>
                <text x={q.x + w / 2} y={q.y + 36} textAnchor="middle" fill="#cbd5e1" fontSize={8}>Bus</text>
                <rect x={q.x + w / 2 - 14} y={q.y + 40} width={28} height={18} rx={3} fill={accent} opacity={0.6} />
                {q.label !== 'Q5' && q.label !== 'Q6' && q.label !== 'Q7' && q.label !== 'Q8' && (
                  <>
                    <rect x={q.x + 6} y={q.y + 54} width={w - 12} height={10} rx={3} fill="#0f172a" opacity={0.5} />
                    <text x={q.x + w / 2} y={q.y + 61} textAnchor="middle" fill="#93c5fd" fontSize={7} fontWeight="bold">{q.label}</text>
                  </>
                )}
              </g>
            );
          })}

          <rect x="60" y="260" width="780" height="120" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
          <rect x="60" y="260" width="780" height="22" rx="6" fill="#1e293b" />
          <rect x="60" y="278" width="780" height="4" fill="#1e293b" />
          <text x="450" y="275" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold" letterSpacing="3">HALL D&apos;ACCUEIL / BILLETTERIE</text>
          <rect x="100" y="295" width="150" height="60" rx="6" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
          <text x="175" y="325" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">Guichets</text>
          <text x="175" y="340" textAnchor="middle" fill="#64748b" fontSize="8">Billetterie</text>
          <rect x="280" y="295" width="150" height="60" rx="6" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
          <text x="355" y="325" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">Salle d&apos;attente</text>
          <text x="355" y="340" textAnchor="middle" fill="#64748b" fontSize="8">Climatisée</text>
          <rect x="460" y="295" width="150" height="60" rx="6" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
          <text x="535" y="325" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">Commerces</text>
          <text x="535" y="340" textAnchor="middle" fill="#64748b" fontSize="8">Café / Restauration</text>
          <rect x="640" y="295" width="100" height="60" rx="6" fill="#3b1f1f" stroke="#ef4444" strokeWidth="1" />
          <text x="690" y="325" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">WC</text>
          <text x="690" y="340" textAnchor="middle" fill="#64748b" fontSize="8">Sanitaires</text>
          <rect x="60" y="400" width="360" height="120" rx="6" fill="#1a2e4a" stroke="#475569" strokeWidth="1" />
          <rect x="60" y="400" width="360" height="20" rx="6" fill="#1e293b" />
          <rect x="60" y="416" width="360" height="4" fill="#1e293b" />
          <text x="240" y="414" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold" letterSpacing="3">PARKING BUS</text>
          {[80, 145, 210, 275, 340].map(x => <rect key={x} x={x} y="430" width="40" height="20" rx="2" fill="#334155" />)}
          <text x="240" y="480" textAnchor="middle" fill="#475569" fontSize="8">Stationnement bus en attente</text>
          <rect x="80" y="488" width="320" height="8" rx="2" fill="url(#zebra)" opacity={0.3} />
          <rect x="480" y="400" width="360" height="120" rx="6" fill="#1a2e4a" stroke="#475569" strokeWidth="1" />
          <rect x="480" y="400" width="360" height="20" rx="6" fill="#1e293b" />
          <rect x="480" y="416" width="360" height="4" fill="#1e293b" />
          <text x="660" y="414" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold" letterSpacing="3">PARKING VOYAGEURS</text>
          {[500, 570, 640, 710, 780].map(x => <rect key={x} x={x} y="430" width="55" height="18" rx="2" fill="#334155" />)}
          <text x="660" y="480" textAnchor="middle" fill="#475569" fontSize="8">Véhicules personnels</text>
          <rect x="500" y="488" width="320" height="8" rx="2" fill="url(#zebra)" opacity={0.3} />
          <rect x="380" y="540" width="140" height="28" rx="4" fill="#1e3a5f" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="450" y="558" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold" letterSpacing="2">ENTREE PRINCIPALE</text>
          <g transform="translate(830, 50)">
            <circle cx="20" cy="20" r="20" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <text x="20" y="18" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">N</text>
            <polygon points="20,2 24,14 16,14" fill="#ef4444" />
            <text x="20" y="32" textAnchor="middle" fill="#64748b" fontSize="6">50m</text>
          </g>
          <g transform="translate(40, 540)">
            <rect width="90" height="24" rx="4" fill="#0f172a" opacity="0.9" />
            {[
              { color: '#3b82f6', label: 'Quai' },
              { color: '#ef4444', label: 'Sortie' },
              { color: '#f59e0b', label: 'Entrée' },
              { color: '#334155', label: 'Parking' },
            ].map((item, i) => (
              <g key={i} transform={`translate(${i * 23}, 4)`}>
                <rect x="0" y="0" width="6" height="6" rx="1" fill={item.color} />
                <text x="8" y="5" fill="#94a3b8" fontSize="6">{item.label}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-3">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1e3a5f]" /> Quai</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#0f172a] border border-[#1e293b]" /> Hall</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1a2e4a]" /> Parking</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#3b1f1f]" /> Sanitaires</span>
      </div>
      <div className="mt-3 flex gap-3">
        <button onClick={() => {
          const svg = document.querySelector('#plan-gare-svg');
          if (!svg) return;
          const clone = svg.cloneNode(true) as SVGSVGElement;
          const serializer = new XMLSerializer();
          const svgStr = serializer.serializeToString(clone);
          const blob = new Blob([svgStr], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'plan-gare.svg';
          a.click();
          URL.revokeObjectURL(url);
        }} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-700 transition">
          <Download size={15} /> Télécharger le plan (SVG)
        </button>
      </div>
    </div>
  );
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <WifiOff size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Mode hors ligne</h1>
          <p className="text-slate-500 mt-1">Preparez vos donnees avant de perdre la connexion</p>
        </div>
        <HorairesSection />
        <PlanGareSection />
      </div>
    </div>
  );
}
