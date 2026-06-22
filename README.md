# 🚌 Gestion Intelligente de Gare Routière (RIHLA)

## 🌍 Contexte
La transformation numérique des infrastructures de transport représente un enjeu stratégique majeur pour améliorer l'efficacité opérationnelle et l'expérience des voyageurs. Les gares routières jouent un rôle central dans l'organisation des déplacements interurbains, mais de nombreux processus restent encore partiellement manuels.

Ce projet propose une **plateforme web intelligente** de gestion de gare routière, développée dans le cadre du Projet de Fin de Semestre à l'**EMSI Marrakech**, reposant sur une architecture distribuée moderne combinant **Spring Boot**, **Next.js**, **MySQL** et **Docker**.

---

## ❗ Problématique
Les systèmes classiques de gestion des gares routières présentent plusieurs limitations :

- 🎫 Réservations manuelles au guichet engendrant de longues files d'attente.
- 🚏 Gestion des quais complexe nécessitant une supervision humaine permanente.
- 🔔 Absence de notifications en temps réel pour les voyageurs et chauffeurs.
- 📋 Manque de traçabilité des réservations et des opérations.
- 🚗 Absence d'automatisation pour la reconnaissance des bus entrants.
- 📊 Aucun outil analytique ou tableau de bord centralisé.
- 🔒 Problèmes de sécurité des accès et de coordination entre acteurs.

---

## 🎯 Objectifs
- 🔐 Gérer l'**authentification sécurisée** avec JWT et contrôle d'accès basé sur les rôles (RBAC).
- 🗺️ Gérer les **trajets, lignes, arrêts** et planifications des compagnies.
- 🎟️ Assurer la **réservation multi-passagers** avec choix interactif des sièges.
- 📄 Générer des **tickets PDF avec QR Code** et les envoyer par email.
- 🚏 Automatiser l'**attribution des quais** via reconnaissance OCR des plaques.
- 💳 Gérer les **paiements, annulations et remboursements progressifs**.
- 🔔 Envoyer des **notifications temps réel** via WebSocket à tous les acteurs.
- 📊 Offrir des **tableaux de bord analytiques** et financiers.
- ⚙️ Implémenter les concepts des **systèmes distribués** : REST, RMI, ActiveMQ/JMS, Resilience4j.

---

## 🛠️ Technologies utilisées

| Technologie | Version | Rôle |
|---|---|---|
| **Spring Boot** | 3.4.4 | Backend REST, sécurité, services métier |
| **Next.js** | 14+ | Frontend SSR, interface utilisateur |
| **TypeScript** | 5+ | Typage fort côté frontend |
| **MySQL** | 8.0 | Base de données relationnelle |
| **Docker** | 25+ | Conteneurisation des services |
| **Spring Security + JWT** | 6+ | Authentification stateless |
| **ActiveMQ** | 5.18 | Broker de messages JMS asynchrones |
| **Resilience4j** | 2+ | Retry, Circuit Breaker, Fallback |
| **RMI Java** | — | Invocation de méthodes distantes (tarification) |
| **WebSocket / STOMP** | — | Notifications temps réel |
| **OpenCV + YOLOv8** | — | Reconnaissance OCR des plaques |
| **iText** | 7+ | Génération de tickets PDF |
| **ZXing** | — | Génération et scan de QR Code |
| **JUnit 5 + Mockito** | 5.10 | Tests unitaires backend |
| **Selenium** | 4+ | Tests d'automatisation UI |
| **SonarQube / SonarCloud** | — | Analyse qualité et sécurité du code |
| **Tailwind CSS** | 3+ | Design et mise en page frontend |

---

## 🏗️ Architecture du système

La plateforme repose sur une **architecture distribuée multicouche** :


---

## 👥 Acteurs du système

| Acteur | Rôle |
|---|---|
| **Administrateur** | Supervision globale, gestion des quais, OCR, tableaux de bord |
| **Voyageur** | Réservation, paiement, gestion des tickets, notifications |
| **Chauffeur** | Consultation trajets, scan QR Code, gestion bagages, départ |
| **Responsable Compagnie** | Gestion bus, trajets, chauffeurs, promotions, statistiques |
| **Système OCR** | Détection automatique des plaques et attribution des quais |

---

## ⚙️ Systèmes Distribués implémentés

- 🔗 **Communication synchrone** – API REST sécurisée par JWT + RMI pour la tarification dynamique
- 📨 **Communication asynchrone** – Apache ActiveMQ / JMS pour les notifications
- 🛡️ **Résilience** – Resilience4j : Retry, Circuit Breaker et Fallback
- ⚡ **Temps réel** – WebSocket / STOMP pour les notifications push
- 📄 **Pagination REST** – Spring Data Pageable pour les grandes collections

---

## 🧩 Modèle de données principal

- **Utilisateur** (id, nom, prénom, email, motDePasse, rôle)
- **Compagnie** (id, nom, email, noteMoyenne)
- **Bus** (id, matricule, capacité, état)
- **Ligne** (id, villeDepart, villeArrivee, active)
- **Trajet** (id, dateDepart, dateArrivee, prix, statut)
- **Réservation** (id, dateReservation, prixTotal, statut)
- **Ticket** (id, qrCode, statut)
- **Paiement** (id, montant, méthode, transactionId, confirmé)
- **Quai** (id, numéro, occupé)
- **StationnementOCR** (id, matriculeDetecte, heureEntree, heureSortie, montantFacture)

---

## 📌 Règles de gestion

- 🔐 Toutes les opérations sensibles nécessitent une authentification JWT préalable.
- 🪑 Les sièges sont verrouillés pendant **10 minutes** lors du paiement pour éviter les conflits.
- 💸 Remboursement progressif : **75%** avant 48h, **50%** le jour même, **0%** après.
- 🔢 Chaque ticket contient un **QR Code unique** vérifié lors de l'embarquement.
- 🚏 Chaque compagnie dispose de **5 quais fixes** attribués automatiquement via OCR.
- 🔄 La libération du quai se déclenche automatiquement lors de la déclaration de départ.

---

## 🗂️ Organisation des Sprints

| Sprint | Fonctionnalités | Technologies |
|---|---|---|
| **Sprint 1** | Infrastructure, authentification JWT, gestion des rôles | Spring Boot, JWT, MySQL, Docker |
| **Sprint 2** | Dashboard administrateur, gestion des quais, annonces bilingues | REST API, Next.js |
| **Sprint 3** | Module OCR, gestion chauffeur, scan QR Code | OpenCV, YOLOv8, ActiveMQ |
| **Sprint 4** | Réservation voyageur, choix sièges, tickets PDF | iText, WebSocket, ZXing |
| **Sprint 5** | Paiement, dashboard financier, tarification dynamique | RMI, Resilience4j |
| **Sprint 6** | Gestion responsable compagnie, promotions, remboursements | Spring Security, JMS |
| **Sprint 7** | Tests, qualité SonarQube, optimisations | JUnit 5, Selenium, SonarQube |

---

## 📌 Structure du projet

```bash
gare-routiere-intelligente/
│
├── backend/                          # Spring Boot
│   └── src/main/java/
│       ├── controller/               # Contrôleurs REST
│       ├── service/                  # Logique métier
│       ├── repository/               # Spring Data JPA
│       ├── model/                    # Entités JPA
│       ├── dto/                      # Data Transfer Objects
│       └── config/                   # SecurityConfig, JwtConfig, ActiveMQConfig, RmiConfig
│   └── src/main/resources/
│       ├── application.yml
│       ├── messages_fr.properties
│       └── messages_ar.properties
│
├── frontend/                         # Next.js + TypeScript
│   └── src/
│       ├── app/                      # Pages Next.js (App Router)
│       ├── components/               # Composants réutilisables
│       └── styles/                   # Tailwind CSS
│
├── docker-compose.yml                # Conteneurisation MySQL
└── README.md
```

---

## 🚀 Lancement du projet

### Prérequis
- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Maven

### Backend
```bash
cd backend
docker-compose up -d        # Démarrer MySQL
mvn spring-boot:run         # Lancer Spring Boot
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # Lancer Next.js sur http://localhost:3000
```

---

## 📊 Qualité du code – SonarCloud

| Métrique | Résultat |
|---|---|
| **Quality Gate** | ✅ Passed |
| **Sécurité** | A – 0 problèmes ouverts |
| **Fiabilité** | A – 0 problèmes ouverts |
| **Maintenabilité** | A – 140 améliorations possibles |
| **Couverture des tests** | 80.7% |
| **Duplication** | 2.2% |
| **Lignes de code** | ~13 000 |

---

## 👨‍💻 Réalisé par

| Nom | Rôle |
|---|---|
| **KOUBRI Hatim** | Développeur Full Stack |
| **LAYHI Rayan** | Développeur Full Stack |

**Encadrant pédagogique :** Dr. Driss ESSABBAR
**Établissement :** EMSI Marrakech – Filière Développement Digital et Systèmes d'Information
**Année universitaire :** 2025–2026

---

## 🔗 Liens

- 📁 **GitHub :** [gare-routiere-intelligente](https://github.com/hatim-koubri/gare-routiere-intelligente/tree/develop)
