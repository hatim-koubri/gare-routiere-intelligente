// Enums
export enum Role {
  VOYAGEUR = 'VOYAGEUR',
  CHAUFFEUR = 'CHAUFFEUR',
  RESPONSABLE_COMPAGNIE = 'RESPONSABLE_COMPAGNIE',
  ADMIN = 'ADMIN'
}

export enum StatutTrajet {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE',
  RETARDE = 'RETARDE'
}

export enum TypeNotification {
  RETARD = 'RETARD',
  ANNULATION = 'ANNULATION',
  CHANGEMENT_QUAI = 'CHANGEMENT_QUAI',
  CONFIRMATION_RESERVATION = 'CONFIRMATION_RESERVATION',
  RAPPEL_DEPART = 'RAPPEL_DEPART',
  INCIDENT = 'INCIDENT',
  ALERTE_GARE = 'ALERTE_GARE'
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  telephone?: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  userId: number;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  telephone?: string;
}

// Offline Types
export interface HoraireOfflineResponse {
  dateGeneration: string;
  periodeDebut: string;
  periodeFin: string;
  nombreTrajets: number;
  trajets: TrajetOfflineDTO[];
}

export interface TrajetOfflineDTO {
  trajetId: number;
  villeDepart: string;
  villeArrivee: string;
  compagnie: string;
  dateDepart: string;
  dateArriveePrevue: string;
  prixBase: number;
  nbSiegesDisponibles: number;
  statut: string;
  arrets: ArretOfflineDTO[];
}

export interface ArretOfflineDTO {
  ville: string;
  ordre: number;
  heurePassage: string;
  dureePauseMinutes: number;
}

export interface NotificationOfflineResponse {
  userEmail: string;
  nombreNotifications: number;
  notifications: NotificationDTO[];
}

export interface NotificationDTO {
  id: number;
  type: string;
  message: string;
  payload: string;
  dateCreation: string;
}