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
