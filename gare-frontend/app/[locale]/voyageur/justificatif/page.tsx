'use client';

import { useState, useEffect, useRef } from 'react';
import { justificatifApi } from '@/lib/api/voyageur/justificatif';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader } from 'lucide-react';

export default function JustificatifPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statut, setStatut] = useState<{ url: string; valide: boolean; uploaded: boolean } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStatut();
  }, []);

  const loadStatut = async () => {
    try {
      const data = await justificatifApi.getStatut();
      setStatut(data);
    } catch (error) {
      console.error('Erreur chargement statut:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const maxSize = 5 * 1024 * 1024;
    if (f.size > maxSize) {
      setError('Fichier trop volumineux (max 5MB)');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(f.type)) {
      setError('Format accepté: JPG, PNG, PDF');
      return;
    }

    setFile(f);
    setError('');
    setSuccess('');

    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const result = await justificatifApi.upload(file);
      setSuccess(result.message);
      setFile(null);
      setPreview(null);
      loadStatut();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Justificatif</h1>
        <p className="text-sm text-gray-500">Uploader un justificatif (carte étudiant, militaire...) pour bénéficier de tarifs réduits</p>
      </div>

      {statut?.uploaded && (
        <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
          statut.valide ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {statut.valide ? (
            <CheckCircle size={24} className="text-green-500 flex-shrink-0" />
          ) : (
            <AlertCircle size={24} className="text-yellow-500 flex-shrink-0" />
          )}
          <div>
            <p className={`font-semibold text-sm ${statut.valide ? 'text-green-700' : 'text-yellow-700'}`}>
              {statut.valide ? 'Justificatif validé ✓' : 'Justificatif en attente de validation'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {statut.valide
                ? 'Vous bénéficiez des tarifs réduits applicables'
                : 'Votre justificatif sera vérifié par un administrateur'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-8 shadow-sm border">
        {!file ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-violet-300 hover:bg-violet-50/30 transition cursor-pointer"
          >
            <Upload size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 font-medium mb-1">Cliquez pour sélectionner un fichier</p>
            <p className="text-sm text-gray-400">JPG, PNG ou PDF • Max 5MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            {preview ? (
              <img src={preview} alt="Aperçu" className="max-h-64 rounded-xl mx-auto" />
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <FileText size={32} className="text-violet-500" />
                <div>
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setFile(null); setPreview(null); setError(''); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                <X size={16} className="inline mr-1" />
                Changer
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-violet-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:bg-gray-300"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader size={16} className="animate-spin" />
                    Upload en cours...
                  </span>
                ) : 'Uploader le justificatif'}
              </button>
            </div>

            {success && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                <CheckCircle size={16} />
                {success}
              </div>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="font-bold text-gray-800 mb-3">Tarifs réduits disponibles</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Étudiant', reduction: '25%', doc: 'Carte étudiant valide' },
            { label: 'Militaire', reduction: '30%', doc: 'Carte militaire' },
            { label: 'Senior (60+)', reduction: '20%', doc: 'Carte d\'identité' },
            { label: 'Enfant (5-12 ans)', reduction: '50%', doc: 'Acte de naissance ou livret familial' },
          ].map(({ label, reduction, doc }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{doc}</p>
              </div>
              <span className="text-violet-600 font-bold">-{reduction}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
