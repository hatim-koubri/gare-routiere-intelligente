# 🚌 Projet : Gestion Intelligente de Gare Routière (RIHLA)

## 🌍 Contexte

La gestion d'une gare routière moderne implique la coordination de plusieurs acteurs : voyageurs, chauffeurs, compagnies de transport et administrateurs. Les processus traditionnels reposent souvent sur des opérations manuelles, générant des files d'attente, des conflits de quais, un manque de traçabilité et une faible supervision des activités.

Le projet **RIHLA** propose une plateforme web intelligente permettant de digitaliser et centraliser l'ensemble des opérations d'une gare routière grâce à une architecture distribuée moderne basée sur **Spring Boot**, **Next.js**, **MySQL** et **Docker**.

---

## 👥 Équipe de développement

Ce projet a été réalisé par :

| Nom | Rôle |
|-----|------|
| **Hatim KOUBRI** | Développeur Full Stack |
| **Rayan LAYHI** | Développeur Full Stack |

---


## ❗ Problématique

Les systèmes traditionnels de gestion des gares routières présentent plusieurs limites :

* 🎫 Réservations et billetterie encore partiellement manuelles.
* 🚏 Difficultés d'attribution et de gestion des quais.
* 🚌 Manque de coordination entre voyageurs, chauffeurs et compagnies.
* 📊 Absence de supervision centralisée et de tableaux de bord décisionnels.
* 🔒 Gestion des accès et de la sécurité insuffisante.
* 📢 Notifications et informations non diffusées en temps réel.
* 📝 Faible traçabilité des opérations et des réservations.

Ces problèmes impactent directement la qualité du service, la productivité et l'expérience des voyageurs.

---

## 🎯 Objectifs

* 👤 Gérer les utilisateurs et les rôles (Administrateur, Voyageur, Chauffeur, Responsable Compagnie).
* 🎫 Permettre la réservation intelligente de trajets.
* 💺 Offrir une sélection interactive des sièges.
* 💳 Gérer les paiements et remboursements.
* 📄 Générer des tickets PDF avec QR Code.
* 🚏 Automatiser l'attribution des quais.
* 🚍 Gérer les bus, lignes et trajets.
* 🔍 Intégrer un module OCR pour la reconnaissance des plaques d'immatriculation.
* 🔔 Envoyer des notifications temps réel.
* 📊 Fournir des dashboards statistiques et financiers.
* 🧪 Assurer la qualité logicielle avec tests automatisés et SonarQube.

---

## 🛠️ Technologies utilisées

### Backend

* Java 21
* Spring Boot
* Spring Security
* JWT Authentication
* Spring Data JPA
* Hibernate
* Maven

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* Axios

### Base de données

* MySQL

### Systèmes Distribués

* ActiveMQ (JMS)
* Java RMI
* WebSocket + STOMP
* Resilience4j

### Qualité Logicielle

* JUnit 5
* Mockito
* Selenium
* SonarQube
* SonarCloud

### Déploiement

* Docker

---

## 🧩 Modules principaux

### 👨‍💼 Administration

* Gestion des utilisateurs
* Gestion des compagnies
* Gestion des quais
* Dashboard financier
* Gestion OCR
* Messagerie interne
* Gestion des annonces

### 🧳 Voyageur

* Recherche de trajets
* Réservation multi-passagers
* Sélection des sièges
* Paiement sécurisé
* Gestion des tickets
* Historique des réservations
* Notifications temps réel

### 🚌 Chauffeur

* Consultation des trajets
* Scan QR Code
* Validation d'embarquement
* Gestion des bagages
* Déclaration des départs
* Signalement des incidents

### 🏢 Responsable Compagnie

* Gestion des bus
* Gestion des lignes
* Gestion des chauffeurs
* Planification des trajets
* Tarification dynamique
* Gestion des promotions
* Suivi des statistiques

### 🤖 Module OCR

* Détection automatique des plaques
* Identification des bus
* Attribution intelligente des quais
* Facturation du stationnement

---

## 📌 Fonctionnalités avancées

* 🔐 Authentification sécurisée JWT + RBAC
* 📄 Génération automatique de tickets PDF
* 📱 QR Code pour validation d'embarquement
* 🔔 Notifications temps réel via WebSocket
* 📬 Notifications asynchrones via ActiveMQ
* 💰 Tarification dynamique via RMI
* 🛡️ Résilience avec Retry, Circuit Breaker et Fallback
* 📑 Pagination REST
* 🌐 Support multilingue (Français / Arabe)

---

## 🏗️ Architecture du projet

```bash
gare-routiere-intelligente/
│
├── backend/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── dto/
│   ├── security/
│   ├── websocket/
│   ├── activemq/
│   ├── rmi/
│   └── config/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   └── public/
│
├── docker/
│
├── docs/
│
├── screenshots/
│
├── docker-compose.yml
├── pom.xml
└── README.md
```

---

## 📊 Qualité Logicielle

Le projet applique une démarche qualité complète :

* ✅ Tests unitaires avec JUnit 5
* ✅ Mocking avec Mockito
* ✅ Tests UI automatisés avec Selenium
* ✅ Analyse statique avec SonarQube
* ✅ Analyse continue avec SonarCloud
* ✅ Respect des principes SOLID
* ✅ Architecture multicouche

---

## 📌 Diagrammes UML


### Diagramme de classes

<img width="1500" height="812" alt="class-diagram" src="https://github.com/user-attachments/assets/8a72b638-a86e-4346-9de1-7150a57c5205" />


---


## 🎥 Vidéo Démonstrative



https://github.com/user-attachments/assets/61558e8e-49b4-4865-b7a1-4330a8a3686e



---

## 🚀 Perspectives

* 📱 Application mobile Android / iOS
* 🤖 Intelligence artificielle pour la prédiction des flux voyageurs
* 📍 Géolocalisation temps réel des bus
* ☁️ Migration vers une architecture Microservices
* 💳 Intégration de solutions de paiement réelles
* 📈 Analyses prédictives avancées
