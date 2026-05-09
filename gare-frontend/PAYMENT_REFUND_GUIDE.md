# Guide d'Implémentation - Paiement et Gestion des Bagages/Accompagnants

## 📋 Vue d'ensemble des fonctionnalités

Ce guide couvre l'implémentation des fonctionnalités suivantes:
1. **Formulaire de paiement** pour les modifications de réservations
2. **Gestion des accompagnants** (ajouter/supprimer avec paiement)
3. **Gestion des bagages** (ajouter/supprimer)
4. **Système de remboursement** pour les suppressions

---

## 🎯 Fonctionnalités Implémentées

### 1. Formulaire de Paiement Réutilisable

**Fichier**: `/components/voyageur/PaymentForm.tsx`

Composant réutilisable pour tout paiement dans l'application.

#### Utilisation:
```tsx
import { PaymentForm, PaymentData } from '@/components/voyageur/PaymentForm';

<PaymentForm
  amount={montant}
  description="Description du paiement"
  onSubmit={(data) => handlePayment(data)}
  loading={isLoading}
  error={error}
/>
```

#### Données du paiement:
```typescript
interface PaymentData {
  numeroCarte: string;        // Numéro de carte sans espaces
  dateExpiration: string;     // Format MM/YY
  cvv: string;                // 3-4 chiffres
  nomTitulaire: string;       // Nom complet
}
```

#### Validations:
- ✅ Numéro de carte: 13-19 chiffres
- ✅ Date d'expiration: Format MM/YY
- ✅ CVV: 3-4 chiffres
- ✅ Nom du titulaire: Non vide
- ✅ SSL 256-bit (affichage)

---

### 2. Modification de Réservation avec Paiement

**Fichier**: `/app/[locale]/voyageur/reservations/[id]/modifier/page.tsx`

#### Fonctionnalités:
- Sélection d'un nouveau trajet
- Sélection des nouveaux sièges
- Calcul automatique des frais de modification:
  - **1ère modification**: GRATUITE
  - **2ème et suivantes**: 20 MAD
- Affichage du formulaire de paiement si frais > 0

#### Flux utilisateur:
```
1. Choisir nouveau trajet
2. Sélectionner nouveaux sièges
3. Voir résumé des frais
4. Si frais > 0:
   - Voir formulaire de paiement
   - Entrer infos carte
   - Confirmer paiement
5. Sinon: Confirmer directement
6. Redirection vers détails réservation
```

#### Endpoints API utilisés:
```
GET /voyageur/reservations/{id}
POST /voyageur/recherche/trajets-filtres
GET /voyageur/reservations/trajets/{trajetId}/plan-bus
POST /voyageur/reservations/{id}/modification/payer
PUT /voyageur/reservations/{id}/modifier
```

---

### 3. Gestion des Accompagnants

**Fichier**: `/app/[locale]/voyageur/reservations/[id]/accompagnants/page.tsx`

#### Fonctionnalités:
- **Ajouter** un accompagnant:
  - Prénom, Nom (obligatoires)
  - Sexe, Âge
  - Catégorie tarifaire (NORMAL, ÉTUDIANT, ENFANT, MILITAIRE, SENIOR)
  - Lien avec l'organisateur
  - Enfant sur les genoux (gratuit)
  - **Formulaire de paiement intégré** pour confirmer le billet

- **Modifier** un accompagnant:
  - Tous les champs modifiables
  - Sans nouveau paiement

- **Supprimer** un accompagnant:
  - Modal de confirmation
  - **Crée une demande de remboursement** automatiquement
  - Montant remboursé = prix du billet supprimé
  - Statut: **En attente de validation du responsable**

#### Catégories tarifaires:
```
NORMAL:    100% du prix
ETUDIANT:  75% du prix (-25%)
ENFANT:    50% du prix (-50%)
MILITAIRE: 70% du prix (-30%)
SENIOR:    80% du prix (-20%)
```

#### Conditions:
- Modifications possibles jusqu'à **24h avant le départ**
- Réservation doit être **CONFIRMEE**
- Pas modifiable si réservation ANNULEE ou REMBOURSEE

#### Endpoints API utilisés:
```
GET /voyageur/reservations/{id}
POST /voyageur/reservations/{id}/membres
PUT /voyageur/reservations/{id}/membres/{membreId}
DELETE /voyageur/reservations/{id}/membres/{membreId}
```

---

### 4. Gestion des Bagages

**Fichier**: `/app/[locale]/voyageur/reservations/[id]/bagages/gerer/page.tsx`

#### Fonctionnalités:
- **Voir** tous les bagages ajoutés:
  - Poids
  - Dimensions
  - Type de bagage
  - Code QR
  - Surcharge tarifaire

- **Ajouter** des bagages:
  - Redirection vers `/bagages` (page d'achat)
  - Poids et dimensions
  - Calcul automatique du surplus

- **Supprimer** un bagage:
  - Modal de confirmation
  - **Crée une demande de remboursement**
  - Montant remboursé = surcharge du bagage
  - Statut: **En attente de validation du responsable**

#### Détails des surcharges:
```
Standard: Max 20kg gratuit
Au-delà:  10 MAD par kg supplémentaire

Exemple:
- Bagage 20kg:  0 MAD
- Bagage 25kg:  50 MAD (5kg × 10)
- Bagage 30kg:  100 MAD (10kg × 10)
```

#### Endpoints API utilisés:
```
GET /voyageur/reservations/{id}
DELETE /voyageur/reservations/{id}/bagages/{bagageId}
POST /voyageur/reservations/{id}/bagages/payer
```

---

### 5. Système de Remboursement

Quand un utilisateur supprime:
- Un **accompagnant** → Remboursement du prix du billet
- Un **bagage** → Remboursement de la surcharge

**La demande de remboursement**:
- ✅ Créée automatiquement
- ✅ Affichée dans `/fr/voyageur/remboursements`
- ✅ **En attente de confirmation du responsable**
- ✅ Statut visible: **EN_ATTENTE** → **ACCEPTE** ou **REFUSE**
- ✅ Montant affiché clairement

**Page de remboursements**: `/fr/voyageur/remboursements/page.tsx`

---

## 📱 Interface utilisateur - Page de Détails

**URL**: `/fr/voyageur/reservations/{id}`

### Boutons d'actions:

| Bouton | Couleur | Icône | Action |
|--------|---------|-------|--------|
| Modifier date/heure | Bleu | ✏️ | Changer trajet/sièges |
| Changer sièges | Orange | 🔄 | Changer sièges du même trajet |
| Acheter bagage | Violet | 📦 | Ajouter bagages supplémentaires |
| Gérer bagages | Indigo | ⚙️ | Supprimer bagages + paiement |
| Accompagnants | Cyan | 👥 | Ajouter/modifier/supprimer |
| Déclarer bagage | Ambre | ⚠️ | Signaler bagage perdu/endommagé |
| Annuler | Rouge | 🗑️ | Annuler la réservation |

---

## 🔄 Flux Complets d'Utilisation

### Flux 1: Modifier la réservation (avec paiement potentiel)

```
1. Page détails → Cliquer "Modifier date/heure"
2. Charger les trajets alternatifs
3. Sélectionner nouveau trajet
4. Sélectionner nouveaux sièges
5. Voir résumé:
   - Frais de modif: 0 MAD (1ère) ou 20 MAD (2ème+)
6. Si frais > 0:
   a. Voir formulaire de paiement
   b. Entrer numéro de carte
   c. Entrer date d'expiration
   d. Entrer CVV
   e. Cliquer "Payer 20 MAD"
7. Confirmation
8. Retour à la page détails
```

### Flux 2: Ajouter un accompagnant (avec paiement)

```
1. Page détails → Cliquer "Accompagnants"
2. Cliquer bouton "+ Ajouter"
3. Remplir formulaire:
   - Prénom, Nom
   - Sexe, Âge
   - Catégorie tarifaire
   - Lien avec organisateur
   - Enfant sur genoux? (optionnel)
4. Si réservation CONFIRMEE:
   - Voir section "Paiement du billet"
   - Entrer infos carte
   - Montant = prix estimé du billet
5. Cliquer "Ajouter"
6. Modal succès
7. Liste mise à jour
```

### Flux 3: Supprimer un accompagnant

```
1. Page accompagnants
2. Cliquer 🗑️ sur un membre
3. Modal confirmation:
   - Nom du membre
   - Montant remboursé
   - Message: "Demande de remboursement sera créée"
4. Cliquer "Supprimer"
5. Member retiré
6. Alert: "Demande de remboursement créée"
7. Redirection vers /remboursements
8. Voir demande avec statut "EN_ATTENTE"
```

### Flux 4: Supprimer un bagage

```
1. Page détails → Cliquer "Gérer bagages"
2. Voir liste des bagages avec surcharges
3. Cliquer 🗑️ sur un bagage
4. Modal confirmation:
   - Poids du bagage
   - Surcharge remboursée
   - Message: "Demande de remboursement sera créée"
5. Cliquer "Supprimer"
6. Bagage retiré
7. Alert: "Demande de remboursement créée"
8. Voir page remboursements
```

---

## 🔗 Pages et Routes

### Pages créées/modifiées:

```
✅ Créé:
   /components/voyageur/PaymentForm.tsx
   /app/[locale]/voyageur/reservations/[id]/bagages/gerer/page.tsx

✅ Modifié:
   /app/[locale]/voyageur/reservations/[id]/page.tsx
   /app/[locale]/voyageur/reservations/[id]/modifier/page.tsx

✅ Existant (utilisé):
   /app/[locale]/voyageur/reservations/[id]/accompagnants/page.tsx
   /app/[locale]/voyageur/remboursements/page.tsx
```

### Routes utilisateur:

```
Détails réservation:
  /fr/voyageur/reservations/{id}

Modifier réservation:
  /fr/voyageur/reservations/{id}/modifier

Accompagnants:
  /fr/voyageur/reservations/{id}/accompagnants

Gérer bagages:
  /fr/voyageur/reservations/{id}/bagages/gerer

Acheter bagages:
  /fr/voyageur/reservations/{id}/bagages

Remboursements:
  /fr/voyageur/remboursements
```

---

## 💳 Validation des Paiements

### Validations Client (PaymentForm.tsx):

```typescript
// Numéro de carte
if (numeroCarte.length < 13 || numeroCarte.length > 19) {
  alert('Numéro de carte invalide');
}

// Date d'expiration
if (!/^\d{2}\/\d{2}$/.test(dateExpiration)) {
  alert('Format de date invalide (MM/YY)');
}

// CVV
if (cvv.length < 3 || cvv.length > 4) {
  alert('CVV invalide');
}

// Nom du titulaire
if (!nomTitulaire.trim()) {
  alert('Veuillez entrer le nom du titulaire');
}
```

### Endpoints Paiement:

```
POST /voyageur/reservations/{id}/modification/payer
  {
    numeroCarte: string,
    dateExpiration: string,
    cvv: string,
    nomTitulaire: string,
    montant: number
  }

POST /voyageur/reservations/{id}/bagages/payer
  {
    numeroCarte: string,
    dateExpiration: string,
    cvv: string,
    nomTitulaire: string
  }
```

---

## 📊 Statuts et États

### Remboursement:
```
EN_ATTENTE    → En attente de confirmation du responsable
ACCEPTE       → Remboursement approuvé
REFUSE        → Remboursement refusé
```

### Réservation pour modifications:
```
CONFIRMEE     → Peut être modifiée
ANNULEE       → Pas de modification possible
REMBOURSEE    → Pas de modification possible
```

---

## ✅ Checklist de Validation

- [x] Composant PaymentForm créé et fonctionnel
- [x] Page modifier avec formulaire de paiement
- [x] Page gérer bagages avec remboursement
- [x] Page accompagnants avec paiement (existant)
- [x] Tous les boutons d'actions visibles
- [x] Validation des formulaires
- [x] Remboursement automatique créé
- [x] Aucune erreur TypeScript
- [x] Design responsive
- [x] Messages utilisateur clairs

---

## 🚀 Déploiement

Aucune migration de base de données requise.

Endpoints backend à vérifier:
```
✅ POST /voyageur/reservations/{id}/modification/payer
✅ POST /voyageur/reservations/{id}/bagages/payer
✅ DELETE /voyageur/reservations/{id}/bagages/{bagageId}
✅ POST /voyageur/reservations/{id}/membres
✅ PUT /voyageur/reservations/{id}/membres/{membreId}
✅ DELETE /voyageur/reservations/{id}/membres/{membreId}
```

---

**Document généré**: Mai 2026
**Statut**: ✅ Complet et testé
