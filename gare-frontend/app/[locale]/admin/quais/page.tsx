'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/common/AdminLayout';
import { adminQuaiApi } from '@/lib/api/admin/quais';
import { adminCompagnieApi } from '@/lib/api/admin/compagnies';
import { Quai, Compagnie } from '@/types';

/* ─── color palette par statut ──────────────────────────────── */
function getColors(disponible: boolean) {
  return disponible
    ? {
        fill: '#e8f8f0', stroke: '#16a34a', accent: '#22c55e',
        badge: '#dcfce7', badgeText: '#15803d', dot: '#22c55e',
        busBody: '#16a34a', busWindow: 'rgba(255,255,255,0.7)',
        shadow: 'rgba(22,163,74,0.18)',
      }
    : {
        fill: '#fff1f0', stroke: '#dc2626', accent: '#ef4444',
        badge: '#fee2e2', badgeText: '#b91c1c', dot: '#ef4444',
        busBody: '#dc2626', busWindow: 'rgba(255,255,255,0.7)',
        shadow: 'rgba(220,38,38,0.18)',
      };
}

/* ─── QuaiCard SVG ──────────────────────────────────────────── */
interface QuaiCardProps {
  quai: Quai;
  x: number;
  y: number;
  onClick: () => void;
  isSelected: boolean;
}

function QuaiCard({ quai, x, y, onClick, isSelected }: QuaiCardProps) {
  const QW = 82;
  const QH = 96;
  const c = getColors(quai.disponible);
  const compNom = quai.compagnieNom ?? '';
  const label = compNom.length > 11 ? compNom.slice(0, 10) + '…' : compNom;

  return (
    <g className="quai-slot" onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* drop shadow */}
      <rect x={x + 2} y={y + 3} width={QW} height={QH} rx={6} fill={c.shadow} />

      {/* main body */}
      <rect x={x} y={y} width={QW} height={QH} rx={6}
        fill={c.fill} stroke={isSelected ? '#0ea5e9' : c.stroke}
        strokeWidth={isSelected ? 2.5 : 1.5} />

      {/* top header band */}
      <rect x={x} y={y} width={QW} height={20} rx={6} fill={c.stroke} />
      <rect x={x} y={y + 14} width={QW} height={6} fill={c.stroke} />

      {/* quai number */}
      <text x={x + QW / 2} y={y + 13} textAnchor="middle" dominantBaseline="central"
        fontFamily="'DM Mono', 'Courier New', monospace" fontSize={11} fontWeight={700}
        fill="#fff" letterSpacing={2}>
        Q{quai.numero}
      </text>

      {/* bus silhouette */}
      <g transform={`translate(${x + QW / 2 - 16}, ${y + 26})`}>
        {/* bus body */}
        <rect width={32} height={28} rx={4} fill={c.busBody} />
        {/* windshield */}
        <rect x={2} y={2} width={28} height={8} rx={2} fill={c.busWindow} />
        {/* windows row */}
        {[2, 11, 20].map((wx, i) => (
          <rect key={i} x={wx} y={12} width={8} height={7} rx={1.5} fill={c.busWindow} />
        ))}
        {/* wheels */}
        <ellipse cx={7} cy={29} rx={5} ry={3} fill="#374151" />
        <ellipse cx={25} cy={29} rx={5} ry={3} fill="#374151" />
        <ellipse cx={7} cy={29} rx={2.5} ry={1.5} fill="#6b7280" />
        <ellipse cx={25} cy={29} rx={2.5} ry={1.5} fill="#6b7280" />
        {/* headlight */}
        <rect x={28} y={4} width={3} height={5} rx={1} fill="#fef08a" />
      </g>

      {/* tarif */}
      <text x={x + QW / 2} y={y + 70} textAnchor="middle"
        fontFamily="'DM Mono', monospace" fontSize={9} fill={c.stroke} fontWeight={700}>
        {quai.tarifHoraire} DH/h
      </text>

      {/* company badge */}
      {!quai.disponible && compNom && (
        <>
          <rect x={x + 4} y={y + 77} width={QW - 8} height={13} rx={6}
            fill={c.badge} stroke={c.stroke} strokeWidth={0.8} />
          <text x={x + QW / 2} y={y + 84} textAnchor="middle" dominantBaseline="central"
            fontFamily="'DM Mono', monospace" fontSize={7} fill={c.badgeText} fontWeight={700}>
            {label}
          </text>
        </>
      )}

      {/* status dot */}
      <circle cx={x + QW - 9} cy={y + 10} r={5} fill={c.dot}
        stroke="#fff" strokeWidth={1.5} />

      {/* selection ring */}
      {isSelected && (
        <rect x={x - 3} y={y - 3} width={QW + 6} height={QH + 6} rx={9}
          fill="none" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="6,3" opacity={0.8} />
      )}
    </g>
  );
}

/* ─── page principale ───────────────────────────────────────── */
export default function QuaisPage() {
  const [quais, setQuais] = useState<Quai[]>([]);
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [attribuerTarget, setAttribuerTarget] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuaiId, setSelectedQuaiId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ numero: 1, tarifHoraire: 0 });

  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [layers, setLayers] = useState({ routes: true, entrees: true, zones: true, bus: true, grille: true });
  const [zoom, setZoom] = useState(77);
  const [legendeOpen, setLegendeOpen] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quaisData, compagniesData] = await Promise.all([
        adminQuaiApi.getAll(),
        adminCompagnieApi.getAll(),
      ]);
      setQuais(quaisData);
      setCompagnies(compagniesData);
    } catch (error) {
      console.error('Erreur chargement', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminQuaiApi.create(formData);
      setShowAddModal(false);
      setFormData({ numero: 1, tarifHoraire: 0 });
      loadData();
    } catch {
      alert('Erreur lors de la création');
    }
  };

  const handleAttribuer = async (compagnieId: number) => {
    if (!attribuerTarget) return;
    try {
      await adminQuaiApi.attribuer(attribuerTarget, compagnieId);
      setAttribuerTarget(null);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur attribution');
    }
  };

  const handleLiberer = async (quaiId: number) => {
    if (confirm('Libérer ce quai ?')) {
      await adminQuaiApi.liberer(quaiId);
      loadData();
    }
  };

  const filteredQuais = useMemo(() =>
    quais.filter(q =>
      q.numero.toString().includes(searchQuery) ||
      (q.compagnieNom?.toLowerCase() ?? '').includes(searchQuery.toLowerCase())
    ), [quais, searchQuery]);

  const disponibles = quais.filter(q => q.disponible).length;
  const occupes = quais.length - disponibles;
  const selectedQuai = quais.find(q => q.id === selectedQuaiId) ?? null;

  /* SVG layout */
  const QW = 82;
  const QH = 96;
  const perRow = 8;
  const rows = Math.ceil(filteredQuais.length / perRow);
  const SVG_W = 860;
  const QUAIS_AREA_X = 60;
  const QUAIS_AREA_Y = 80;
  const QUAIS_AREA_W = 760;
  const GAP = 10;
  const totalQW = Math.min(filteredQuais.length, perRow) * (QW + GAP) - GAP;
  const startX = QUAIS_AREA_X + (QUAIS_AREA_W - totalQW) / 2;
  const contentH = QUAIS_AREA_Y + rows * (QH + GAP + 14) + 30;
  const CIRC_Y = contentH + 10;
  const ROAD_Y = CIRC_Y + 50;
  const SVG_H = ROAD_Y + 80;

  const filterOptions = [
    { key: 'tous',        label: 'Tous',         color: '#3b82f6' },
    { key: 'disponible',  label: 'Disponible',   color: '#16a34a' },
    { key: 'occupe',      label: 'Occupé',        color: '#dc2626' },
    { key: 'maintenance', label: 'Maintenance',  color: '#d97706' },
    { key: 'horsService', label: 'Hors service', color: '#9ca3af' },
  ];

  const layerOptions = [
    { key: 'routes',  label: 'Routes & Voirie' },
    { key: 'entrees', label: 'Entrées / Sorties' },
    { key: 'zones',   label: 'Zones & Terminal' },
    { key: 'bus',     label: 'Bus & Silhouettes' },
    { key: 'grille',  label: 'Grille blueprint' },
  ];

  /* blueprint crosshatch pattern for trottoir */
  const zebraStripes = Array.from({ length: 30 }, (_, i) => i * 12);

  return (
    <AdminLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        /* scrollbars */
        .sb::-webkit-scrollbar { width: 4px; }
        .sb::-webkit-scrollbar-track { background: #f1f5f9; }
        .sb::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        .ps::-webkit-scrollbar { width: 6px; height: 6px; }
        .ps::-webkit-scrollbar-track { background: #f8fafc; }
        .ps::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }

        /* quai hover */
        .quai-slot { transition: filter .15s, transform .15s; transform-origin: center; }
        .quai-slot:hover { filter: brightness(0.96) drop-shadow(0 4px 12px rgba(0,0,0,0.15)); }

        /* sidebar filter button */
        .fbtn {
          display: flex; align-items: center; gap: 9px; width: 100%;
          padding: 6px 10px; border-radius: 7px; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500;
          background: transparent; color: #64748b; transition: all .12s;
        }
        .fbtn:hover { background: #f1f5f9; color: #0f172a; }
        .fbtn.on { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        .fbtn.on .fb-dot { box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }

        /* layer checkbox */
        .lcb { accent-color: #3b82f6; width: 14px; height: 14px; }

        /* zoom range */
        .zr { -webkit-appearance: none; height: 3px; border-radius: 2px; background: #e2e8f0; outline: none; flex: 1; }
        .zr::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }

        /* bottom / action buttons */
        .bbb {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
          transition: all .12s; white-space: nowrap;
        }
        .bbb:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }

        .zbtn {
          width: 22px; height: 22px; border-radius: 5px; border: 1.5px solid #e2e8f0;
          background: #fff; cursor: pointer; color: #64748b; font-size: 15px;
          display: flex; align-items: center; justify-content: center;
          transition: all .1s;
        }
        .zbtn:hover { border-color: #3b82f6; color: #3b82f6; }

        /* sidebar section header */
        .sh {
          font-family: 'DM Mono', monospace; font-size: 9.5px; font-weight: 500;
          color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;
          margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
        }

        /* stat chip */
        .stat-chip {
          display: flex; flex-direction: column; align-items: center;
          background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 8px 12px; flex: 1; gap: 2px;
        }

        /* blueprint pulse dot */
        @keyframes pulse-ring {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(2.2); }
        }
        .pulse-ring {
          animation: pulse-ring 1.8s ease-out infinite;
        }

        /* modal */
        .modal-input {
          width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0;
          color: #0f172a; font-size: 14px; padding: 9px 13px; border-radius: 8px;
          outline: none; font-family: 'Inter', sans-serif; transition: border-color .15s;
        }
        .modal-input:focus { border-color: #3b82f6; background: #fff; }

        /* blueprint grid subtle pulse on load */
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .map-area { animation: fadeIn .4s ease; }

        /* compass rose rotate */
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ROOT — light theme */}
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: '#f0f4f8', fontFamily: "'Inter', sans-serif", overflow: 'hidden',
      }}>

        {/* ══ TOP HEADER BAR ══ */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '0 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 52, flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* blueprint icon */}
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/><line x1="15" y1="9" x2="15" y2="21"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: 0.3 }}>
                Plan des Quais
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, color: '#94a3b8', letterSpacing: 1 }}>
                GARE ROUTIÈRE · BLUEPRINT v2
              </div>
            </div>
          </div>

          {/* Stats chips */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Total', val: quais.length, color: '#3b82f6', bg: '#eff6ff' },
              { label: 'Libres', val: disponibles, color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Occupés', val: occupes, color: '#dc2626', bg: '#fef2f2' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px',
                background: s.bg, borderRadius: 8, border: `1px solid ${s.color}22`,
              }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: s.color, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 10, height: 10 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e' }} />
              <div className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', opacity: 0.4 }} />
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#64748b', letterSpacing: 0.5 }}>
              TEMPS RÉEL
            </span>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* ══ SIDEBAR ══ */}
          <div className="sb" style={{
            width: 226, minWidth: 226, background: '#fff',
            borderRight: '1.5px solid #e2e8f0', display: 'flex',
            flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
          }}>
            <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 22 }}>

              {/* SEARCH */}
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Rechercher quai…"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                    color: '#0f172a', fontSize: 12.5, padding: '7px 10px 7px 28px',
                    borderRadius: 8, outline: 'none', fontFamily: "'Inter', sans-serif",
                  }} />
              </div>

              {/* FILTRES */}
              <div>
                <div className="sh">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filtres
                </div>
                {filterOptions.map(opt => (
                  <button key={opt.key} className={`fbtn${filterStatus === opt.key ? ' on' : ''}`}
                    onClick={() => setFilterStatus(opt.key)}>
                    <span className="fb-dot" style={{
                      width: 9, height: 9, borderRadius: '50%', background: opt.color,
                      flexShrink: 0, transition: 'box-shadow .15s',
                    }} />
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* CALQUES */}
              <div>
                <div className="sh">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  Calques
                </div>
                {layerOptions.map(l => (
                  <label key={l.key} style={{
                    display: 'flex', alignItems: 'center', gap: 9, padding: '5px 6px',
                    cursor: 'pointer', fontSize: 12.5, color: '#475569', borderRadius: 6,
                    transition: 'background .1s',
                  }}>
                    <input type="checkbox" className="lcb"
                      checked={layers[l.key as keyof typeof layers]}
                      onChange={() => setLayers(prev => ({ ...prev, [l.key]: !prev[l.key as keyof typeof layers] }))} />
                    {l.label}
                  </label>
                ))}
              </div>

              {/* ZOOM */}
              <div>
                <div className="sh" style={{ marginBottom: 10 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  Zoom
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button className="zbtn" onClick={() => setZoom(z => Math.max(30, z - 10))}>−</button>
                  <input type="range" min={30} max={150} value={zoom} className="zr"
                    onChange={e => setZoom(Number(e.target.value))} />
                  <button className="zbtn" onClick={() => setZoom(z => Math.min(150, z + 10))}>+</button>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, color: '#1e40af', minWidth: 36, textAlign: 'right' }}>{zoom}%</span>
                </div>
              </div>

              {/* ACTIVITÉ */}
              <div>
                <div className="sh">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  Activité récente
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {quais.slice(0, 5).map((q, i) => {
                    const m = Math.abs(new Date().getMinutes() - i * 4) % 60;
                    const t = `${String(new Date().getHours()).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    return (
                      <div key={q.id} style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '5px 8px', background: '#f8fafc', borderRadius: 7,
                        border: '1px solid #f1f5f9',
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: q.disponible ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'DM Mono', monospace", color: '#94a3b8', fontSize: 9.5 }}>{t}</span>
                        <span style={{ color: '#475569', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Q{q.numero} {q.disponible ? '→ Libre' : `→ ${q.compagnieNom ?? 'Occupé'}`}
                        </span>
                      </div>
                    );
                  })}
                  {quais.length === 0 && <span style={{ fontSize: 12, color: '#94a3b8' }}>Aucune activité</span>}
                </div>
                {/* mini bar */}
                <div style={{ marginTop: 10, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${quais.length > 0 ? (disponibles / quais.length) * 100 : 0}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 2, transition: 'width .5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#16a34a' }}>LIBRES {disponibles}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#dc2626' }}>OCCUPÉS {occupes}</span>
                </div>
              </div>

            </div>
          </div>

          {/* ══ ZONE CENTRALE ══ */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative' }}>

            {/* ── MAP CANVAS ── */}
            <div className="ps map-area" style={{
              flex: 1, overflow: 'auto', background: '#eef2f7',
              position: 'relative',
              backgroundImage: `
                radial-gradient(circle at 20px 20px, rgba(148,163,184,0.08) 1px, transparent 1px),
                radial-gradient(circle at 60px 60px, rgba(148,163,184,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px, 80px 80px',
            }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: '#64748b' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1 }}>CHARGEMENT DU PLAN…</span>
                </div>
              ) : (
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', transition: 'transform .2s', padding: 20 }}>
                  <svg
                    width={SVG_W}
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    xmlns="http://www.w3.org/2000/svg"
                    onClick={e => { if (!(e.target as Element).closest('.quai-slot')) setSelectedQuaiId(null); }}
                    style={{ display: 'block', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1.5px solid #cbd5e1' }}
                  >
                    <defs>
                      {/* Blueprint fine grid */}
                      {layers.grille && (
                        <>
                          <pattern id="bp-minor" width={10} height={10} patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth={0.5} />
                          </pattern>
                          <pattern id="bp-major" width={50} height={50} patternUnits="userSpaceOnUse">
                            <rect width={50} height={50} fill="url(#bp-minor)" />
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth={0.8} />
                          </pattern>
                        </>
                      )}
                      {/* green grass hatch */}
                      <pattern id="grass" width={8} height={8} patternUnits="userSpaceOnUse">
                        <rect width={8} height={8} fill="#bbf7d0" />
                        <line x1={0} y1={4} x2={8} y2={4} stroke="#86efac" strokeWidth={0.8} />
                        <line x1={4} y1={0} x2={4} y2={8} stroke="#86efac" strokeWidth={0.8} opacity={0.5} />
                      </pattern>
                      {/* zebra crosswalk */}
                      <pattern id="zebra" width={12} height={8} patternUnits="userSpaceOnUse">
                        <rect width={12} height={8} fill="#e2e8f0" />
                        <rect width={6} height={8} fill="#f8fafc" />
                      </pattern>
                      {/* concrete texture */}
                      <pattern id="concrete" width={6} height={6} patternUnits="userSpaceOnUse">
                        <rect width={6} height={6} fill="#f1f5f9" />
                        <rect x={0} y={0} width={3} height={3} fill="#f8fafc" opacity={0.6} />
                        <rect x={3} y={3} width={3} height={3} fill="#e9eef4" opacity={0.4} />
                      </pattern>
                      {/* road asphalt */}
                      <pattern id="asphalt" width={4} height={4} patternUnits="userSpaceOnUse">
                        <rect width={4} height={4} fill="#94a3b8" />
                        <rect x={0} y={0} width={2} height={2} fill="#8896a8" opacity={0.5} />
                        <rect x={2} y={2} width={2} height={2} fill="#9ca8b8" opacity={0.3} />
                      </pattern>
                      {/* Drop shadow filter */}
                      <filter id="shadow-sm">
                        <feDropShadow dx={0} dy={2} stdDeviation={3} floodOpacity={0.12} />
                      </filter>
                      <filter id="shadow-md">
                        <feDropShadow dx={0} dy={4} stdDeviation={8} floodOpacity={0.15} />
                      </filter>
                    </defs>

                    {/* ── FOND principal blanc cassé ── */}
                    <rect width={SVG_W} height={SVG_H} fill="#f8fafc" />
                    {layers.grille && <rect width={SVG_W} height={SVG_H} fill="url(#bp-major)" />}

                    {/* ── BORDURE extérieure du plan ── */}
                    <rect x={1} y={1} width={SVG_W - 2} height={SVG_H - 2} rx={10}
                      fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6,4" opacity={0.3} />

                    {/* ── BANDES VERTES latérales (espace vert) ── */}
                    <rect x={0} y={0} width={58} height={SVG_H} fill="url(#grass)" rx={0} />
                    <rect x={SVG_W - 58} y={0} width={58} height={SVG_H} fill="url(#grass)" />
                    {/* arbres gauche */}
                    {layers.entrees && [40, 120, 200, 280, 360, 440, 520].map((ty, i) => (
                      <g key={i} transform={`translate(29,${ty + 20})`}>
                        <circle r={12} fill="#4ade80" opacity={0.7} />
                        <circle r={8} fill="#22c55e" opacity={0.9} />
                        <rect x={-1.5} y={10} width={3} height={8} fill="#92400e" />
                      </g>
                    ))}
                    {/* arbres droite */}
                    {layers.entrees && [60, 150, 240, 320, 400, 480].map((ty, i) => (
                      <g key={i} transform={`translate(${SVG_W - 29},${ty + 20})`}>
                        <circle r={12} fill="#4ade80" opacity={0.7} />
                        <circle r={8} fill="#22c55e" opacity={0.9} />
                        <rect x={-1.5} y={10} width={3} height={8} fill="#92400e" />
                      </g>
                    ))}
                    {/* vert labels */}
                    <text x={29} y={SVG_H / 2} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize={8}
                      fill="#15803d" letterSpacing={2} transform={`rotate(-90,29,${SVG_H / 2})`} opacity={0.5}>
                      ESPACE VERT
                    </text>
                    <text x={SVG_W - 29} y={SVG_H / 2} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize={8}
                      fill="#15803d" letterSpacing={2} transform={`rotate(90,${SVG_W - 29},${SVG_H / 2})`} opacity={0.5}>
                      ESPACE VERT
                    </text>

                    {/* ── ZONE ENTRÉE HAUT ── */}
                    {layers.entrees && (
                      <g>
                        <rect x={58} y={0} width={SVG_W - 116} height={34} fill="#dbeafe" />
                        <rect x={58} y={0} width={SVG_W - 116} height={34} fill="none"
                          stroke="#3b82f6" strokeWidth={1} opacity={0.4} />
                        <text x={SVG_W / 2} y={20} textAnchor="middle"
                          fontFamily="'DM Mono',monospace" fontSize={9} fill="#1d4ed8"
                          fontWeight={500} letterSpacing={3} opacity={0.85}>
                          ▲ ZONE ENTRÉE · CONTRÔLE ACCÈS ▲
                        </text>
                        {/* barrier gates */}
                        {[140, 220, 320, 420, 520, 620, 720].map((gx, i) => (
                          <g key={i}>
                            <rect x={gx - 1} y={0} width={2} height={34} fill="#3b82f6" opacity={0.3} />
                            <circle cx={gx} cy={17} r={5} fill="#3b82f6" opacity={0.7} />
                            <text x={gx} y={20} textAnchor="middle" fontFamily="'DM Mono',monospace"
                              fontSize={5} fill="#fff" fontWeight={700}>G{i + 1}</text>
                          </g>
                        ))}
                      </g>
                    )}

                    {/* ── VOIE BUS ENTRANTE ── */}
                    {layers.routes && (
                      <g>
                        <rect x={58} y={34} width={SVG_W - 116} height={24} fill="url(#asphalt)" opacity={0.7} />
                        <line x1={58} y1={34} x2={SVG_W - 58} y2={34} stroke="#94a3b8" strokeWidth={1} />
                        <line x1={58} y1={58} x2={SVG_W - 58} y2={58} stroke="#94a3b8" strokeWidth={1} />
                        {/* direction arrows */}
                        {[140, 280, 420, 560, 700].map(ax => (
                          <g key={ax}>
                            <polygon points={`${ax},40 ${ax + 10},46 ${ax},52`} fill="#f59e0b" opacity={0.7} />
                          </g>
                        ))}
                        <text x={SVG_W / 2} y={50} textAnchor="middle"
                          fontFamily="'DM Mono',monospace" fontSize={7} fill="#64748b" letterSpacing={3}>
                          VOIE D'ACCÈS BUS
                        </text>
                      </g>
                    )}

                    {/* ── ZONE BÉTON QUAIS (fond) ── */}
                    <rect x={58} y={58} width={SVG_W - 116} height={contentH - 30}
                      fill="url(#concrete)" />
                    <rect x={58} y={58} width={SVG_W - 116} height={contentH - 30}
                      fill="none" stroke="#cbd5e1" strokeWidth={1.5} />

                    {/* Zone title */}
                    <text x={80} y={76} fontFamily="'DM Mono',monospace" fontSize={8}
                      fill="#3b82f6" letterSpacing={3} opacity={0.6} fontWeight={500}>
                      ZONE D'EMBARQUEMENT — QUAIS VOYAGEURS
                    </text>
                    {/* blueprint corner marks */}
                    {[[58, 58], [SVG_W - 58, 58], [58, contentH - 28], [SVG_W - 58, contentH - 28]].map(([cx, cy], i) => (
                      <g key={i}>
                        <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#3b82f6" strokeWidth={1} opacity={0.4} />
                        <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="#3b82f6" strokeWidth={1} opacity={0.4} />
                        <circle cx={cx} cy={cy} r={3} fill="none" stroke="#3b82f6" strokeWidth={1} opacity={0.4} />
                      </g>
                    ))}

                    {/* ── ROW LABELS + QUAIS ── */}
                    {Array.from({ length: rows }).map((_, row) => {
                      const rowY = QUAIS_AREA_Y + row * (QH + GAP + 14);
                      return (
                        <g key={row}>
                          {/* row label left */}
                          <rect x={58} y={rowY + QH / 2 - 10} width={3} height={20}
                            fill="#3b82f6" opacity={0.6} />
                          <text x={54} y={rowY + QH / 2 + 1}
                            textAnchor="end" fontFamily="'DM Mono',monospace"
                            fontSize={10} fill="#3b82f6" fontWeight={500} dominantBaseline="central">
                            {String.fromCharCode(65 + row)}
                          </text>
                          {/* row label right */}
                          <rect x={SVG_W - 61} y={rowY + QH / 2 - 10} width={3} height={20}
                            fill="#3b82f6" opacity={0.6} />
                          <text x={SVG_W - 54} y={rowY + QH / 2 + 1}
                            textAnchor="start" fontFamily="'DM Mono',monospace"
                            fontSize={10} fill="#3b82f6" fontWeight={500} dominantBaseline="central">
                            {String.fromCharCode(65 + row)}
                          </text>
                          {/* pedestrian strip below row */}
                          <rect x={62} y={rowY + QH + 2} width={SVG_W - 124} height={12}
                            fill="url(#zebra)" opacity={0.6} />
                          <text x={SVG_W / 2} y={rowY + QH + 10}
                            textAnchor="middle" fontFamily="'DM Mono',monospace"
                            fontSize={6} fill="#64748b" letterSpacing={3}>
                            PASSAGE PIÉTONS · RANG {String.fromCharCode(65 + row)}
                          </text>
                        </g>
                      );
                    })}

                    {/* ── QUAIS ── */}
                    {filteredQuais.map((quai, i) => {
                      const col = i % perRow;
                      const row = Math.floor(i / perRow);
                      const x = startX + col * (QW + GAP);
                      const y = QUAIS_AREA_Y + row * (QH + GAP + 14);
                      return (
                        <QuaiCard
                          key={quai.id}
                          quai={quai}
                          x={x}
                          y={y}
                          isSelected={selectedQuaiId === quai.id}
                          onClick={() => setSelectedQuaiId(prev => prev === quai.id ? null : quai.id)}
                        />
                      );
                    })}
                    {filteredQuais.length === 0 && (
                      <text x={SVG_W / 2} y={QUAIS_AREA_Y + 60}
                        textAnchor="middle" fill="#94a3b8"
                        fontFamily="'DM Mono',monospace" fontSize={13} letterSpacing={1}>
                        AUCUN QUAI TROUVÉ
                      </text>
                    )}

                    {/* ── ALLÉE VOYAGEURS ── */}
                    <rect x={58} y={contentH - 28} width={SVG_W - 116} height={20}
                      fill="#fef9c3" opacity={0.7} />
                    <line x1={62} y1={contentH - 18} x2={SVG_W - 62} y2={contentH - 18}
                      stroke="#ca8a04" strokeWidth={0.8} strokeDasharray="8,5" opacity={0.5} />
                    <text x={SVG_W / 2} y={contentH - 12} textAnchor="middle"
                      fontFamily="'DM Mono',monospace" fontSize={7} fill="#92400e" letterSpacing={3} opacity={0.7}>
                      ◄ ALLÉE PRINCIPALE VOYAGEURS ►
                    </text>

                    {/* ── VOIE CIRCULATION INTERNE ── */}
                    {layers.routes && (
                      <g>
                        <rect x={58} y={CIRC_Y} width={SVG_W - 116} height={44}
                          fill="url(#asphalt)" opacity={0.65} />
                        <line x1={58} y1={CIRC_Y} x2={SVG_W - 58} y2={CIRC_Y}
                          stroke="#64748b" strokeWidth={1.2} />
                        <line x1={58} y1={CIRC_Y + 44} x2={SVG_W - 58} y2={CIRC_Y + 44}
                          stroke="#64748b" strokeWidth={1.2} />
                        {/* center dashed line */}
                        <line x1={58} y1={CIRC_Y + 22} x2={SVG_W - 58} y2={CIRC_Y + 22}
                          stroke="#f8fafc" strokeWidth={1} strokeDasharray="14,8" opacity={0.5} />
                        {/* arrows voirie going right */}
                        {[140, 300, 460, 620].map(ax => (
                          <g key={ax}>
                            <polygon points={`${ax},${CIRC_Y + 9} ${ax + 14},${CIRC_Y + 15} ${ax},${CIRC_Y + 21}`}
                              fill="#fbbf24" opacity={0.6} />
                          </g>
                        ))}
                        {/* arrows going left */}
                        {[220, 380, 540, 700].map(ax => (
                          <g key={ax}>
                            <polygon points={`${ax},${CIRC_Y + 23} ${ax - 14},${CIRC_Y + 29} ${ax},${CIRC_Y + 35}`}
                              fill="#fbbf24" opacity={0.4} />
                          </g>
                        ))}
                        <text x={SVG_W / 2} y={CIRC_Y + 41}
                          textAnchor="middle" fontFamily="'DM Mono',monospace"
                          fontSize={7} fill="#94a3b8" letterSpacing={3}>
                          ALLÉE VOIRIE · CIRCULATION INTERNE
                        </text>

                        {/* Parking P / P+ badges */}
                        {layers.entrees && (
                          <>
                            <rect x={62} y={CIRC_Y + 8} width={22} height={13} rx={3}
                              fill="#1d4ed8" />
                            <text x={73} y={CIRC_Y + 18} textAnchor="middle"
                              fontFamily="'Syne',sans-serif" fontSize={9} fill="#fff" fontWeight={800}>P</text>
                            <rect x={62} y={CIRC_Y + 24} width={22} height={12} rx={3}
                              fill="#0ea5e9" />
                            <text x={73} y={CIRC_Y + 33} textAnchor="middle"
                              fontFamily="'Syne',sans-serif" fontSize={7.5} fill="#fff" fontWeight={800}>P+</text>
                          </>
                        )}
                      </g>
                    )}

                    {/* ── ROUTE PRINCIPALE ── */}
                    <rect x={58} y={ROAD_Y} width={SVG_W - 116} height={56}
                      fill="url(#asphalt)" opacity={0.85} />
                    <line x1={58} y1={ROAD_Y} x2={SVG_W - 58} y2={ROAD_Y}
                      stroke="#475569" strokeWidth={2} />
                    <line x1={58} y1={ROAD_Y + 56} x2={SVG_W - 58} y2={ROAD_Y + 56}
                      stroke="#475569" strokeWidth={2} />
                    {/* yellow center line */}
                    <line x1={58} y1={ROAD_Y + 28} x2={SVG_W - 58} y2={ROAD_Y + 28}
                      stroke="#fbbf24" strokeWidth={2} strokeDasharray="20,12" />
                    <text x={SVG_W / 2} y={ROAD_Y + 44}
                      textAnchor="middle" fontFamily="'DM Mono',monospace"
                      fontSize={9} fill="#f1f5f9" letterSpacing={4} opacity={0.6}>
                      ROUTE PRINCIPALE
                    </text>

                    {/* ENTRÉE / SORTIE ramps */}
                    {layers.entrees && (
                      <>
                        {/* ENTRÉE ramp */}
                        <rect x={130} y={ROAD_Y - 18} width={100} height={18}
                          fill="#4a5568" stroke="#475569" strokeWidth={1} />
                        <text x={180} y={ROAD_Y - 6} textAnchor="middle"
                          fontFamily="'DM Mono',monospace" fontSize={8} fill="#fbbf24" letterSpacing={2}>
                          ▶ ENTRÉE
                        </text>
                        {/* SORTIE ramp */}
                        <rect x={SVG_W - 230} y={ROAD_Y - 18} width={100} height={18}
                          fill="#4a5568" stroke="#475569" strokeWidth={1} />
                        <text x={SVG_W - 180} y={ROAD_Y - 6} textAnchor="middle"
                          fontFamily="'DM Mono',monospace" fontSize={8} fill="#fbbf24" letterSpacing={2}>
                          SORTIE ◀
                        </text>
                        {/* STOP sign */}
                        {layers.zones && (
                          <g transform={`translate(${SVG_W - 120}, ${ROAD_Y - 20})`}>
                            <rect width={36} height={18} rx={3} fill="#dc2626" />
                            <text x={18} y={12} textAnchor="middle"
                              fontFamily="'DM Mono',monospace" fontSize={9} fill="#fff" fontWeight={700} letterSpacing={1}>
                              STOP
                            </text>
                          </g>
                        )}
                      </>
                    )}

                    {/* AIRE D'ATTENTE */}
                    {layers.zones && (
                      <g>
                        <rect x={200} y={ROAD_Y - 22} width={140} height={22}
                          fill="#eff6ff" stroke="#3b82f6" strokeWidth={1} rx={2} opacity={0.9} />
                        <text x={270} y={ROAD_Y - 9} textAnchor="middle"
                          fontFamily="'DM Mono',monospace" fontSize={7} fill="#1d4ed8" letterSpacing={1} fontWeight={500}>
                          AIRE D'ATTENTE
                        </text>
                        {/* waiting people dots */}
                        {[218, 234, 250, 266, 282, 298, 314].map((px, i) => (
                          <circle key={i} cx={px} cy={ROAD_Y - 4} r={3} fill="#3b82f6" opacity={0.5} />
                        ))}
                      </g>
                    )}

                    {/* ── COMPASS rose (déco blueprint) ── */}
                    <g transform={`translate(${SVG_W - 40}, 50)`}>
                      <circle r={14} fill="#fff" stroke="#cbd5e1" strokeWidth={1.5} />
                      <circle r={10} fill="none" stroke="#e2e8f0" strokeWidth={0.8} />
                      {[0, 90, 180, 270].map((deg, i) => {
                        const labels = ['N', 'E', 'S', 'O'];
                        const rad = (deg * Math.PI) / 180;
                        const dx = Math.sin(rad) * 10;
                        const dy = -Math.cos(rad) * 10;
                        return (
                          <text key={i} x={dx} y={dy + 3} textAnchor="middle"
                            fontFamily="'DM Mono',monospace" fontSize={5.5}
                            fill={i === 0 ? '#dc2626' : '#94a3b8'} fontWeight={700}>
                            {labels[i]}
                          </text>
                        );
                      })}
                      <circle r={2} fill="#3b82f6" />
                    </g>

                    {/* ── Plan title stamp ── */}
                    <g transform={`translate(64, ${SVG_H - 18})`}>
                      <text fontFamily="'DM Mono',monospace" fontSize={7} fill="#94a3b8" letterSpacing={1.5}>
                        PLAN REF: GR-{new Date().getFullYear()}-Q · ÉCHELLE 1:200 · NORD ↑
                      </text>
                    </g>

                  </svg>
                </div>
              )}

              {/* ── LÉGENDE flottante — LIGHT ── */}
              <div style={{
                position: 'absolute', top: 14, left: 14,
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 12, minWidth: 190,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                fontFamily: "'Inter', sans-serif",
              }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 13px',
                    borderBottom: legendeOpen ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => setLegendeOpen(o => !o)}
                >
                  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: 10, color: '#1e40af', letterSpacing: 2, textTransform: 'uppercase' }}>
                    Légende
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                    style={{ transform: legendeOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .2s' }}>
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
                {legendeOpen && (
                  <div style={{ padding: '10px 13px', maxHeight: 320, overflowY: 'auto' }}>
                    {[
                      { label: 'Statut Quais', items: [
                        { fill: '#f0fdf4', border: '#16a34a', label: 'Quai Disponible' },
                        { fill: '#fef2f2', border: '#dc2626', label: 'Quai Occupé' },
                        { fill: '#fffbeb', border: '#d97706', label: 'En Maintenance' },
                        { fill: '#f9fafb', border: '#9ca3af', label: 'Hors Service' },
                      ]},
                    ].map(section => (
                      <div key={section.label}>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>{section.label}</div>
                        {section.items.map(l => (
                          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, color: '#475569' }}>
                            <div style={{ width: 18, height: 12, borderRadius: 3, background: l.fill, border: `1.5px solid ${l.border}`, flexShrink: 0 }} />
                            {l.label}
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, margin: '8px 0 5px' }}>Circulation</div>
                    {[
                      { color: '#94a3b8', label: 'Voie bus' },
                      { color: '#64748b', label: 'Route principale' },
                      { color: '#fbbf24', label: 'Marquage central' },
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, color: '#475569' }}>
                        <div style={{ width: 18, height: 5, borderRadius: 1, background: l.color, flexShrink: 0 }} />
                        {l.label}
                      </div>
                    ))}
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, margin: '8px 0 5px' }}>Infrastructure</div>
                    {[
                      { fill: '#bbf7d0', label: 'Espace vert' },
                      { fill: '#fef9c3', label: 'Allée voyageurs' },
                      { fill: '#eff6ff', label: 'Aire d\'attente' },
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, color: '#475569' }}>
                        <div style={{ width: 18, height: 9, borderRadius: 2, background: l.fill, border: '1px solid #e2e8f0', flexShrink: 0 }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── TERMINAL VOYAGEURS (right panel) ── */}
              <div style={{
                position: 'absolute', top: 14, right: 14,
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 12, width: 158,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                fontFamily: "'Inter', sans-serif", overflow: 'hidden',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                  padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 500, color: '#fff', letterSpacing: 1.5 }}>TERMINAL</span>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>i</span>
                  </div>
                </div>
                <div style={{ padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12 }}>🏢</span>
                    <span style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 600 }}>Hall d'accueil</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Guichets</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 3 }}>
                      {[1, 2, 3, 4, 5, 6].map(g => (
                        <div key={g} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#1d4ed8', fontWeight: 500 }}>{g}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Salle d'attente</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 2 }}>
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} style={{ background: '#dbeafe', borderRadius: 1, height: 8 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 5, padding: '5px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14 }}>☕</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#ea580c', fontWeight: 500 }}>CAFÉ</div>
                    </div>
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 5, padding: '5px', textAlign: 'center' }}>
                      <div style={{ fontSize: 14 }}>🧳</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: '#7c3aed', fontWeight: 500 }}>BAGAGES</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '5px 4px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: '#1d4ed8', lineHeight: 1 }}>H</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#64748b' }}>TOILETTES</div>
                    </div>
                    <div style={{ background: '#fdf2f8', border: '1px solid #f9a8d4', borderRadius: 5, padding: '5px 4px', textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: '#be185d', lineHeight: 1 }}>F</div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 6.5, color: '#64748b' }}>TOILETTES</div>
                    </div>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: 6, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 500, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sortie de Secours</div>
                    <div style={{ fontSize: 16, marginTop: 2 }}>🚪</div>
                  </div>
                </div>
              </div>

              {/* ── PANNEAU QUAI SÉLECTIONNÉ ── */}
              {selectedQuai && (
                <div style={{
                  position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
                  background: '#fff', border: '2px solid #0ea5e9',
                  borderRadius: 14, padding: '16px 18px', minWidth: 190,
                  fontFamily: "'Inter', sans-serif", boxShadow: '0 8px 32px rgba(14,165,233,0.18)',
                }}>
                  {/* header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", color: '#0f172a', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                      Q{selectedQuai.numero}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      fontFamily: "'DM Mono',monospace", letterSpacing: 0.5,
                      background: selectedQuai.disponible ? '#dcfce7' : '#fee2e2',
                      color: selectedQuai.disponible ? '#15803d' : '#b91c1c',
                      border: `1px solid ${selectedQuai.disponible ? '#86efac' : '#fca5a5'}`,
                    }}>
                      {selectedQuai.disponible ? '● LIBRE' : '● OCCUPÉ'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '7px 10px' }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Tarif</div>
                      <div style={{ color: '#0f172a', fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{selectedQuai.tarifHoraire}<span style={{ fontSize: 10, fontWeight: 400, color: '#64748b' }}> DH/h</span></div>
                    </div>
                    {!selectedQuai.disponible && selectedQuai.compagnieNom && (
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontFamily: "'DM Mono',monospace", color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Compagnie</div>
                        <div style={{ color: '#0f172a', fontSize: 12, fontWeight: 600 }}>{selectedQuai.compagnieNom}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {selectedQuai.disponible ? (
                      <button
                        onClick={() => { setAttribuerTarget(selectedQuai.id); setSelectedQuaiId(null); }}
                        style={{
                          flex: 1, background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                          color: '#fff', fontSize: 11, fontWeight: 700, border: 'none',
                          padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                          fontFamily: "'DM Mono',monospace", letterSpacing: 1,
                          textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                        }}>
                        Attribuer
                      </button>
                    ) : (
                      <button
                        onClick={() => { handleLiberer(selectedQuai.id); setSelectedQuaiId(null); }}
                        style={{
                          flex: 1, background: 'linear-gradient(135deg, #b91c1c, #ef4444)',
                          color: '#fff', fontSize: 11, fontWeight: 700, border: 'none',
                          padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                          fontFamily: "'DM Mono',monospace", letterSpacing: 1,
                          textTransform: 'uppercase', boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
                        }}>
                        Libérer
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedQuaiId(null)}
                      style={{
                        background: '#f1f5f9', color: '#64748b', fontSize: 11,
                        fontWeight: 600, border: '1.5px solid #e2e8f0',
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                      }}>
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SEARCH BAR ── */}
            <div style={{
              background: '#fff', borderTop: '1px solid #e2e8f0',
              padding: '6px 16px', display: 'flex', gap: 10,
              alignItems: 'center', flexShrink: 0,
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par numéro ou compagnie…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                    color: '#0f172a', fontSize: 13, padding: '6px 12px 6px 30px',
                    borderRadius: 8, outline: 'none', fontFamily: "'Inter', sans-serif",
                    transition: 'border-color .15s',
                  }}
                />
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {filteredQuais.length} quai{filteredQuais.length !== 1 ? 's' : ''} affiché{filteredQuais.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* ══ BARRE DU BAS ══ */}
        <div style={{
          background: '#fff', borderTop: '1.5px solid #e2e8f0',
          padding: '8px 18px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, flexShrink: 0,
          boxShadow: '0 -1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="bbb" onClick={() => setShowAddModal(true)}
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter un Quai
            </button>
            <button className="bbb"
              style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}
              onClick={() => selectedQuai && setAttribuerTarget(selectedQuai.id)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Assigner un Bus
            </button>
            <button className="bbb"
              style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}
              onClick={loadData}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Actualiser
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative', width: 9, height: 9 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e' }} />
              <div className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', opacity: 0.4 }} />
            </div>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: '#64748b', letterSpacing: 0.5 }}>
              DONNÉES EN TEMPS RÉEL · GARE ROUTIÈRE
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="bbb" style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exporter PDF
            </button>
            <button className="bbb" style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Imprimer
            </button>
            <button className="bbb" style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', padding: '7px 10px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ══ MODAL CRÉATION ══ */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", color: '#0f172a', fontSize: 17, fontWeight: 800, margin: 0 }}>Nouveau Quai</h2>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#94a3b8', letterSpacing: 1.5 }}>GESTION INFRASTRUCTURE</div>
              </div>
            </div>
            <form onSubmit={handleCreate}>
              {[
                { label: 'Numéro du quai', id: 'numero', type: 'number', val: formData.numero, onChange: (v: string) => setFormData({ ...formData, numero: parseInt(v) || 1 }), min: 1, step: '1' },
                { label: 'Tarif horaire (DH/h)', id: 'tarif', type: 'number', val: formData.tarifHoraire, onChange: (v: string) => setFormData({ ...formData, tarifHoraire: parseFloat(v) || 0 }), min: 0, step: '0.01' },
              ].map(f => (
                <div key={f.id} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontFamily: "'DM Mono',monospace", color: '#64748b', fontSize: 9.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={f.type} required min={f.min} step={f.step} value={f.val}
                    onChange={e => f.onChange(e.target.value)}
                    className="modal-input"
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button type="submit" style={{
                  flex: 1, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: '#fff',
                  fontFamily: "'Syne',sans-serif", fontWeight: 700, letterSpacing: 0.5,
                  border: 'none', padding: '10px', borderRadius: 9, cursor: 'pointer',
                  fontSize: 13, boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                }}>Créer le quai</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{
                  flex: 1, background: '#f1f5f9', color: '#64748b',
                  border: '1.5px solid #e2e8f0', padding: '10px', borderRadius: 9,
                  cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif",
                }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL ATTRIBUTION ══ */}
      {attribuerTarget !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", color: '#0f172a', fontSize: 17, fontWeight: 800, margin: '0 0 4px' }}>
                Attribuer Q{quais.find(q => q.id === attribuerTarget)?.numero}
              </h2>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: '#94a3b8', letterSpacing: 1.5 }}>SÉLECTIONNER UNE COMPAGNIE</div>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {compagnies.map(compagnie => (
                <button
                  key={compagnie.id}
                  onClick={() => handleAttribuer(compagnie.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left', padding: '11px 14px',
                    background: '#f8fafc', border: '1.5px solid #e2e8f0',
                    borderRadius: 10, cursor: 'pointer', transition: 'all .12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLElement).style.background = '#eff6ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                >
                  <div>
                    <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 14, fontFamily: "'Inter',sans-serif" }}>{compagnie.nom}</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", color: '#94a3b8', fontSize: 10, letterSpacing: 0.5 }}>Code: {compagnie.code}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              ))}
            </div>
            <button
              onClick={() => setAttribuerTarget(null)}
              style={{ width: '100%', background: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}