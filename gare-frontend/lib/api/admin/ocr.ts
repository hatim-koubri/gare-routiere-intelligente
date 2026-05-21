import { apiClient } from '../client';
import {
  OCRDetectionResponse,
  OCRCorrectionRequest,
  StationnementOCR
} from '@/types';
import { storage } from '@/lib/utils/storage';

export const adminOcrApi = {

  uploadImage: async (
    file: File
  ): Promise<OCRDetectionResponse> => {
    const token = storage.getToken();
    if (!token) {
      console.error("[OCR Upload] Token manquant avant l'envoi");
      throw new Error("Session expirée");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post(
      "/admin/ocr/upload",
      formData,
      {
        timeout: 60000,
      }
    );

    return response.data;
  },

  traiterMatricule: async (
    matricule: string
  ): Promise<OCRDetectionResponse> => {

    const response = await apiClient.post(
      `/admin/ocr/matricule/${matricule}`
    );

    return response.data;
  },

  corrigerOCR: async (
    stationnementId: number,
    data: OCRCorrectionRequest
  ): Promise<OCRDetectionResponse> => {

    const response = await apiClient.put(
      `/admin/ocr/corriger/${stationnementId}`,
      data
    );

    return response.data;
  },

  getStationnements: async (): Promise<StationnementOCR[]> => {

    const response = await apiClient.get(
      '/admin/ocr/stationnements'
    );

    return response.data;
  },

  getCorrectionsEnAttente: async (): Promise<StationnementOCR[]> => {

    const response = await apiClient.get(
      '/admin/ocr/corrections-en-attente'
    );

    return response.data;
  },

  terminerStationnement: async (
    stationnementId: number
  ): Promise<StationnementOCR> => {

    const response = await apiClient.post(
      `/admin/ocr/terminer/${stationnementId}`
    );

    return response.data;
  },

  telechargerFacture: async (stationnementId: number): Promise<Blob> => {
    const response = await apiClient.get(
      `/admin/factures/stationnement/${stationnementId}`,
      { responseType: 'blob' }
    );
    return response.data;
  },
};