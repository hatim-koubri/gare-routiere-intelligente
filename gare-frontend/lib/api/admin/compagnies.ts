import { apiClient } from '../client';
import { Compagnie } from '@/types';

export const adminCompagnieApi = {
  getAll: async (): Promise<Compagnie[]> => {
    try {
      const response = await apiClient.get('/admin/compagnies');
      
      // Prendre la réponse brute
      let data = response.data;
      
      // Si c'est une chaîne, essayer de parser avec une approche tolérante
      if (typeof data === 'string') {
        try {
          // Remplacer les motifs problématiques
          let fixed = data;
          
          // Supprimer les références circulaires récursives
          let previous;
          do {
            previous = fixed;
            fixed = fixed.replace(/"compagnie":\{[^{}]*\}/g, '"compagnie":null');
            fixed = fixed.replace(/"compagnie":null,\s*/g, '');
            fixed = fixed.replace(/,"compagnie":null/g, '');
            fixed = fixed.replace(/"bus":\[[^\]]*\]/g, '"bus":[]');
            fixed = fixed.replace(/,\s*}/g, '}');
            fixed = fixed.replace(/,\s*]/g, ']');
          } while (fixed !== previous);
          
          const parsed = JSON.parse(fixed);
          if (Array.isArray(parsed)) return parsed;
          if (parsed?.content && Array.isArray(parsed.content)) return parsed.content;
        } catch (e) {
          console.error('Erreur parsing:', e);
        }
      }
      
      if (Array.isArray(data)) return data;
      if (data?.content && Array.isArray(data.content)) return data.content;
      
      return [];
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  },

  create: async (data: Partial<Compagnie>): Promise<Compagnie> => {
    const response = await apiClient.post('/admin/compagnies', data);
    return response.data;
  },

  ajouterResponsable: async (compagnieId: number, data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    telephone?: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.post(`/admin/compagnies/${compagnieId}/responsables`, data);
    return response.data;
  },
};