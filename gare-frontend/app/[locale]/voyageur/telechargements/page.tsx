'use client';

import { useState } from 'react';
import { offlineApi } from '@/lib/api/offline';
import { FileText, FileSpreadsheet, Calendar, Download, ArrowLeft, Bus, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TelechargementsPage() {
  const [loading, setLoading] = useState<'plan' | 'mois' | null>(null);
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const telechargerPlan = async () => {
    setLoading('plan');
    try {
      if (format === 'pdf') {
        await offlineApi.downloadHorairesPDF(7);
      } else {
        await offlineApi.downloadHorairesExcel(7);
      }
    } catch (error) {
      console.error('Erreur téléchargement plan:', error);
    } finally {
      setLoading(null);
    }
  };

  const telechargerTrajetsMois = async () => {
    setLoading('mois');
    try {
      await offlineApi.downloadHorairesExcel(30);
    } catch (error) {
      console.error('Erreur téléchargement trajets mois:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Téléchargements</h1>
          <p className="text-sm text-gray-500">Exportez les horaires et plans de la gare</p>
        </div>
        <Link
          href="/fr/voyageur/dashboard"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
      </div>

      {/* Télécharger le plan (hebdomadaire) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-800 text-lg mb-1">Télécharger le plan des horaires</h2>
            <p className="text-sm text-gray-500 mb-4">
              Exportez le planning des 7 prochains jours au format PDF
            </p>
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="accent-blue-600"
                />
                <FileText size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-700">PDF</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                  className="accent-blue-600"
                />
                <FileSpreadsheet size={16} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700">Excel</span>
              </label>
            </div>
            <button
              onClick={telechargerPlan}
              disabled={loading === 'plan'}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
            >
              {loading === 'plan' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Télécharger le plan
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            <Calendar size={12} />
            7 jours
          </div>
        </div>
      </div>

      {/* Télécharger tous les trajets du mois */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet size={22} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-800 text-lg mb-1">Tous les trajets du mois</h2>
            <p className="text-sm text-gray-500 mb-4">
              Exportez la liste complète des trajets des 30 prochains jours au format Excel
            </p>
            <div className="flex items-center gap-2 mb-4 text-xs text-gray-400">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>Données incluant les arrêts, prix et places disponibles</span>
            </div>
            <button
              onClick={telechargerTrajetsMois}
              disabled={loading === 'mois'}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
            >
              {loading === 'mois' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Télécharger le mois complet
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
            <Calendar size={12} />
            30 jours
          </div>
        </div>
      </div>
    </div>
  );
}
