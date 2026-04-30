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
// Trajet - avec relations complètes
export interface Trajet {
  id: number;
  dateDepart: string;
  dateArriveePrevue?: string;
  dateArriveeReelle?: string;
  statut: string;
  retardMinutes?: number;
  nbReservations?: number;
  
  // IDs
  ligneId: number;
  busId: number;
  chauffeurId?: number;
  quaiId?: number;
  
  // Objets relations (optionnels - pour les réponses enrichies)
  ligne?: {
    id: number;
    villeDepart: string;
    villeArrivee: string;
    prixBase: number;
    dureeMinutes?: number;
    compagnie?: {
      id: number;
      nom: string;
      code: string;
    };
  };
  bus?: {
    id: number;
    matricule: string;
    marque: string;
    modele?: string;
    nbSieges: number;
  };
  quai?: {
    id: number;
    numero: number;
    tarifHoraire: number;
  };
  chauffeur?: {
    id: number;
    nom: string;
    prenom: string;
  };
  
  // Champs plats (pour compatibilité API simple)
  villeDepart?: string;
  villeArrivee?: string;
  compagnieNom?: string;
  busMatricule?: string;
  nbSieges?: number;
  quaiNumero?: number;
  chauffeurNom?: string;
  
  // Pour les arrêts
  arrets?: Arret[];
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
// ============ SPRINT 4 - TYPES VOYAGEUR ============

// Recherche
export interface RechercheTrajetRequest {
  villeDepart: string;
  villeArrivee: string;
  date: string;
  prixMin?: number;
  prixMax?: number;
  heureDepartMin?: number;
  heureDepartMax?: number;
  nbArretsMax?: number;
}

export interface TrajetRechercheDTO {
  id: number;
  villeDepart: string;
  villeArrivee: string;
  dateDepart: string;
  heureDepart: string;
  compagnieNom: string;
  prixBase: number;
  prixFinal: number;
  dureeMinutes: number;
  nbArrets: number;
  nbSiegesDisponibles: number;
}

// Réservation
export interface MembreGroupeRequest {
  nomManuel?: string;
  prenomManuel?: string;
  sexe?: 'HOMME' | 'FEMME';
  age?: number;
  categorieTarifaire?: string;
  lienOrganisateur?: string;
  enfantSurGenoux?: boolean;
  compteExistantId?: number;
}

// ✅ AJOUTER CETTE INTERFACE
export interface MembreGroupeDTO {
  id: number;
  nom: string;
  prenom: string;
  sexe: string;
  age: number;
  categorieTarifaire: string;
  lienOrganisateur: string;
  enfantSurGenoux: boolean;
  prixTicket: number;
  numeroSiege?: string;
  qrCode?: string;
}

export interface ReservationRequest {
  trajetId: number;
  typeGroupe: 'MOI_SEUL' | 'MOI_PLUS_ACCOMPAGNANTS' | 'AUTRE_PERSONNE';
  membres: MembreGroupeRequest[];
  numerosSieges?: string[];
}

export interface ReservationResponse {
  id: number;
  prixTotal: number;
  statut: string;
  trajet: TrajetRechercheDTO;
  membres: MembreGroupeDTO[];  // ← Maintenant MembreGroupeDTO existe
}

// Plan bus
export interface SiegePlanDTO {
  numeroSiege: string;
  occupe: boolean;
  bloque: boolean;
  verrouilleTemporaire: boolean;
  verrouilleParReservationId?: number;
}

// Paiement
export interface PaiementRequest {
  reservationId: number;
  methodePaiement: 'CARTE' | 'PAYPAL';
}

export interface PaiementResponse {
  paiementId: number;
  reservationId: number;
  montant: number;
  methodePaiement: string;
  transactionId: string;
  datePaiement: string;
  confirme: boolean;
  statutReservation: string;  // "CONFIRMEE"
}

export interface TicketDTO {
  id: number;
  qrCode: string;
  nomPassager: string;
  prenomPassager: string;
  numeroSiege: string;
  prix: number;
  categorieTarifaire: string;
}
// ============ DASHBOARD VOYAGEUR ============

export interface VoyageurStats {
  totalReservations: number;
  totalDepense: number;
  totalTrajetsAvenir: number;
  totalTrajetsPasses: number;
  compagnieFavorite: string;
  trajetsParMois: {
    mois: string;
    count: number;
    totalDepense: number;
  }[];
}

export interface ReservationHistorique {
  id: number;
  dateReservation: string;
  dateDepart: string;
  villeDepart: string;
  villeArrivee: string;
  compagnieNom: string;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'REMBOURSEE';
  prixTotal: number;
  nombrePassagers: number;
  numerosSieges: string[];
  trajetId: number;
}

export interface DashboardVoyageurData {
  stats: VoyageurStats;
  reservations: ReservationHistorique[];
  prochainsTrajets: ReservationHistorique[];
  historique: ReservationHistorique[];
}