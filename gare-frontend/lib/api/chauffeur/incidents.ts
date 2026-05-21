import { IncidentRequest, IncidentResponse } from '@/types';

// URL de base du backend - utilise la variable d'environnement (définie dans .env ou docker-compose)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const chauffeurIncidentApi = {
  // Signaler un incident - Version directe sans proxy
  signalerIncident: async (data: IncidentRequest): Promise<IncidentResponse> => {
    const token = localStorage.getItem('auth_token');
    console.log('=== APPEL DIRECT ===');
    console.log('TrajetId:', data.trajetId);
    console.log('Type:', data.type);
    console.log('Description:', data.description);
    console.log('Token présent:', !!token);
    
    const response = await fetch(`${API_BASE}/chauffeur/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        trajetId: data.trajetId,
        type: data.type,
        description: data.description
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur réponse:', response.status, errorText);
      throw new Error(`Erreur ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Succès:', result);
    return result;
  },
};