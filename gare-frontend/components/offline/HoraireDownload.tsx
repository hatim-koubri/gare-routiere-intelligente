'use client';

import { useState } from 'react';
import { offlineApi } from '@/lib/api/offline';

export default function HoraireDownload() {
  const [jours, setJours] = useState(7);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setMessage('');
    try {
      await offlineApi.downloadHoraires(jours);
      setMessage('Téléchargement terminé !');
    } catch (err) {
      setMessage('Erreur lors du téléchargement');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSaveOffline = async () => {
    setLoading(true);
    setMessage('');
    try {
      await offlineApi.saveHorairesOffline(jours);
      setMessage('Horaires sauvegardés hors ligne !');
    } catch (err) {
      setMessage('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4">Horaires hors ligne</h3>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Nombre de jours</label>
        <input
          type="number"
          min={1}
          max={30}
          value={jours}
          onChange={(e) => setJours(parseInt(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300"
        >
          {loading ? 'Chargement...' : 'Télécharger JSON'}
        </button>
        
        <button
          onClick={handleSaveOffline}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Chargement...' : 'Sauvegarder offline'}
        </button>
      </div>
      
      {message && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded text-center">
          {message}
        </div>
      )}
    </div>
  );
}