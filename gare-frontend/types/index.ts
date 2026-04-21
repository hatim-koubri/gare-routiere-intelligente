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
// ============ SPRINT 2 - TYPES ============

// Bus
export interface Bus {
  id: number;
  matricule: string;
  marque: string;
  modele?: string;
  nbSieges: number;
  climatise: boolean;
  wifi: boolean;
  dateMaintenance?: string;
  enMaintenance: boolean;
  actif: boolean;
  compagnieId?: number;
  compagnie?: {  // ← Ajoute cette possibilité
    id: number;
    nom: string;
    code: string;
    
  };
  compagnieNom?: string;
}

export interface BusRequest {
  matricule: string;
  marque: string;
  modele?: string;
  nbSieges: number;
  climatise: boolean;
  wifi: boolean;
  dateMaintenance?: string;
  compagnieId: number;
}

// Compagnie
export interface Compagnie {
  id: number;
  nom: string;
  code: string;
  logo?: string;
  description?: string;
  telephone?: string;
  email?: string;
  actif: boolean;
}

// Ligne
export interface Ligne {
  id: number;
  villeDepart: string;
  villeArrivee: string;
  dureeMinutes?: number;
  prixBase: number;
  actif: boolean;
  compagnieId: number;
  compagnieNom?: string;
  arrets?: Arret[];
}

export interface Arret {
  id?: number;
  ville: string;
  ordre: number;
  dureePauseMinutes?: number;
  heurePrevueOffsetMinutes?: number;
}

export interface LigneRequest {
  villeDepart: string;
  villeArrivee: string;
  dureeMinutes?: number;
  prixBase: number;
  compagnieId: number;
  arrets?: Arret[];
}

// Quai
export interface Quai {
  id: number;
  numero: number;
  tarifHoraire: number;
  disponible: boolean;
  compagnieId?: number;
  compagnieNom?: string;
}

export interface QuaiRequest {
  numero: number;
  tarifHoraire: number;
  compagnieId?: number;
}

// Trajet
export interface Trajet {
  id: number;
  ligneId: number;
  ligneNom?: string;
  busId: number;
  busMatricule?: string;
  chauffeurId?: number;
  chauffeurNom?: string;
  quaiId?: number;
  quaiNumero?: number;
  dateDepart: string;
  dateArriveePrevue?: string;
  statut: string;
  retardMinutes?: number;
  nbReservations?: number;
  nbSieges?: number;
  compagnieNom?: string;
  villeDepart?: string;
  villeArrivee?: string;
  arrets?: Arret[];  // ← Ajouter cette ligne
}

export interface TrajetRequest {
  ligneId: number;
  busId: number;
  chauffeurId?: number;
  quaiId?: number;
  dateDepart: string;
  dateArriveePrevue?: string;
}

// Chauffeur
export interface Chauffeur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  numeroPermis?: string;
  dateEmbauche?: string;
  enConge: boolean;
  compagnieId: number;
  compagnieNom?: string;
}

// Code Promo
export interface CodePromo {
  id: number;
  code: string;
  pourcentageReduction: number;
  dateExpiration: string;
  nbUtilisationsMax?: number;
  nbUtilisationsActuel: number;
  actif: boolean;
  compagnieId?: number;
}

export interface CodePromoRequest {
  code: string;
  pourcentageReduction: number;
  dateExpiration: string;
  nbUtilisationsMax?: number;
  compagnieId?: number;
}

// Annonce
export interface Annonce {
  id: number;
  titreFr: string;
  titreAr?: string;
  contenuFr: string;
  contenuAr?: string;
  dateDebut?: string;
  dateFin?: string;
  active: boolean;
  compagnieId?: number;
}

// Tarification
export interface TarificationConfig {
  reductionTrentejours: number;
  reductionQuinzeJours: number;
  supplementJourMeme: number;
  seuilHaut: number;
  supplementHaut: number;
  seuilBas: number;
  reductionBas: number;
}
// ============ SPRINT 3 - TYPES ============

// OCR
export interface OCRDetectionResponse {
  matricule: string;
  statut: 'DETECTE' | 'INCONNU' | 'ILLISIBLE';
  stationnementId: number;
  quaiAttribue?: number;
  compagnie?: string;
  message: string;
  succès: boolean;
}

export interface OCRCorrectionRequest {
  matricule: string;
  heureEntree?: string;
  heureSortie?: string;
  quaiId?: number;
}

export interface StationnementOCR {
  id: number;
  matricule: string;
  compagnieNom?: string;
  quaiAttribue?: number;
  debut: string;
  fin?: string;
  statut: 'EN_COURS' | 'TERMINE' | 'CORRECTION_MANUELLE';
  montant?: number;
  correctionManuelle: boolean;
}

// Incident
export interface IncidentRequest {
  trajetId: number;
  type: string;
  description: string;
}

export interface IncidentResponse {
  id: number;
  type: string;
  description: string;
  dateIncident: string;
  resolu: boolean;
  trajetId: number;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string;
  chauffeurId: number;
  chauffeurNom: string;
  chauffeurPrenom: string;
}

// Jalon
export interface JalonRequest {
  trajetId: number;
  ville: string;
  ordre: number;
}

// Manifeste
export interface ManifesteResponse {
  trajetId: number;
  ligne: string;
  dateDepart: string;
  nbPassagers: number;
  passagers: ManifestePassager[];
}

export interface ManifestePassager {
  nom: string;
  prenom: string;
  siege: string;
  categorie: string;
  statut: string;
  enfantSurGenoux: boolean;
}

// Validation ticket
export interface ValidationTicketResponse {
  valide: boolean;
  nomPassager: string;
  prenomPassager: string;
  numeroSiege: string;
  categorie: string;
  enfantSurGenoux: boolean;
  message: string;
}

// Scan bagage
export interface ScanBagageResponse {
  bagageId: number;
  qrCodeBagage: string;
  nomVoyageur: string;
  emailVoyageur: string;
  poidsKg: number;
  surplusPrix: number;
  message: string;
}