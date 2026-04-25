import { apiClient } from '../client';
import { Trajet, ManifesteResponse } from '@/types';

export const chauffeurTrajetApi = {
  getTrajetsJour: async (): Promise<Trajet[]> => {
    const response = await apiClient.get('/chauffeur/trajets/jour');
    const trajets = response.data;
    
    console.log('=== getTrajetsJour - RAW API RESPONSE ===');
    console.log('1. Type de response.data:', typeof response.data);
    console.log('2. Est un tableau:', Array.isArray(response.data));
    console.log('3. Nombre d\'éléments:', response.data?.length);
    console.log('4. Response.data complet:', JSON.stringify(response.data, null, 2));
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('5. Premier élément:', response.data[0]);
      console.log('6. Clés du premier élément:', Object.keys(response.data[0]));
      console.log('7. Premier élément JSON:', JSON.stringify(response.data[0], null, 2));
    }
    
    console.log('=== FIN getTrajetsJour ===');
    
    return Array.isArray(trajets) ? trajets : [];
  },

  getManifeste: async (trajetId: number): Promise<ManifesteResponse> => {
    const response = await apiClient.get(`/chauffeur/trajets/${trajetId}/manifeste`);
    
    console.log(`=== getManifeste - TRAJET ${trajetId} ===`);
    console.log('1. Type de response.data:', typeof response.data);
    console.log('2. Response.data:', response.data);
    console.log('3. Response.data JSON:', JSON.stringify(response.data, null, 2));
    console.log(`=== FIN getManifeste ===`);
    
    return response.data;
  },
  getHistoriqueTrajets: async (): Promise<Trajet[]> => {
  const response = await apiClient.get('/chauffeur/trajets/historique');
  return Array.isArray(response.data) ? response.data : [];
},
getIncidents: async (): Promise<any[]> => {
    const response = await apiClient.get('/chauffeur/incidents');
    return Array.isArray(response.data) ? response.data : [];
  },
};