package ma.emsi.gare.service;

import ma.emsi.gare.dto.response.TrajetResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.request.IncidentRequest;
import ma.emsi.gare.dto.request.JalonRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutTicket;
import ma.emsi.gare.enums.StatutTrajet;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.enums.StatutStationnement;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChauffeurService {

    private final TrajetRepository trajetRepository;
    private final TicketRepository ticketRepository;
    private final BagageRepository bagageRepository;
    private final IncidentRepository incidentRepository;
    private final StationnementOCRRepository stationnementRepo;
    private final QuaiRepository quaiRepository;
    private final WebSocketNotificationService wsNotifService;
    private final NotificationOfflineService notifOfflineService;
    private final PdfService pdfService;
    private final ChauffeurRepository chauffeurRepository;
    private final JalonValideRepository jalonValideRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final ResponsableNotificationHelper responsableNotificationHelper;
    private final UserRepository userRepository;

    // =========================================================
    // Helper: Notifier tous les voyageurs d'un trajet
    // =========================================================
    private void notifierVoyageursTrajet(Trajet trajet, String typeWs, Map<String, Object> data, String message) {
        List<Reservation> reservations = trajet.getReservations();
        if (reservations == null || reservations.isEmpty()) return;

        Set<String> emails = reservations.stream()
                .map(r -> r.getVoyageur().getEmail())
                .collect(Collectors.toSet());

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(data);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            payloadJson = "{\"trajetId\":" + trajet.getId() + "}";
        }

        TypeNotification typeNotif = switch (typeWs) {
            case "JALON_ARRIVEE" -> TypeNotification.JALON_ARRIVEE;
            case "JALON_DEPART" -> TypeNotification.JALON_DEPART;
            case "TRAJET_TERMINE" -> TypeNotification.TRAJET_TERMINE;
            default -> TypeNotification.ALERTE_GARE;
        };

        for (String email : emails) {
            wsNotifService.notifierVoyageur(email, typeWs, data);
            notifOfflineService.creerNotification(email, typeNotif, message, payloadJson);
        }
        log.info("{} voyageurs notifiés pour trajet {}: {}", emails.size(), trajet.getId(), typeWs);
    }

    // =========================================================
    // US-33 — Trajet du jour du chauffeur
    // =========================================================
    public List<TrajetResponseDTO> getTrajetsJour(Long chauffeurId) {
        LocalDateTime debutJour = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(30); // Afficher les 30 prochains jours

        // ✅ Inclure RETARDE en plus
        List<StatutTrajet> statutsActifs = List.of(
                StatutTrajet.PLANIFIE,
                StatutTrajet.EN_COURS,
                StatutTrajet.RETARDE   // ← AJOUTER RETARDE
        );

        return trajetRepository
                .findByDateDepartBetweenAndStatutIn(
                        debutJour, finJour,
                        statutsActifs)  // ← Utiliser la liste
                .stream()
                .filter(t -> t.getChauffeur() != null
                        && t.getChauffeur().getId().equals(chauffeurId))
                .map(this::toTrajetDTO)
                .toList();
    }

    private TrajetResponseDTO toTrajetDTO(Trajet t) {
        TrajetResponseDTO dto = new TrajetResponseDTO();
        dto.setId(t.getId());
        dto.setDateDepart(t.getDateDepart());
        dto.setDateArriveePrevue(t.getDateArriveePrevue());
        dto.setDateArriveeReelle(t.getDateArriveeReelle());
        dto.setStatut(t.getStatut().name());
        dto.setRetardMinutes(t.getRetardMinutes());
        dto.setNbReservations(t.getNbReservations());
        int nbReservations = t.getReservations() != null ? t.getReservations().size() : 0;
        dto.setNbReservations(nbReservations);

        if (t.getLigne() != null) {
            dto.setLigneId(t.getLigne().getId());
            dto.setVilleDepart(t.getLigne().getVilleDepart());
            dto.setVilleArrivee(t.getLigne().getVilleArrivee());
            dto.setPrixBase(t.getLigne().getPrixBase());

            if (t.getLigne().getCompagnie() != null) {
                dto.setCompagnieId(t.getLigne().getCompagnie().getId());
                dto.setCompagnieNom(t.getLigne().getCompagnie().getNom());
            }
        }

        if (t.getBus() != null) {
            dto.setBusId(t.getBus().getId());
            dto.setBusMatricule(t.getBus().getMatricule());
            dto.setBusMarque(t.getBus().getMarque());
            dto.setNbSieges(t.getBus().getNbSieges());
        }

        if (t.getChauffeur() != null) {
            dto.setChauffeurId(t.getChauffeur().getId());
            dto.setChauffeurNom(t.getChauffeur().getNom());
            dto.setChauffeurPrenom(t.getChauffeur().getPrenom());
        }

        if (t.getQuai() != null) {
            dto.setQuaiId(t.getQuai().getId());
            dto.setQuaiNumero(t.getQuai().getNumero());
        }

        return dto;
    }

    // =========================================================
    // US-35 — T3-16 Validation QR Code ticket
    // =========================================================
    @Transactional
    public Map<String, Object> validerTicketQR(String qrCode) {
        Ticket ticket = ticketRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Ticket invalide"));

        if (ticket.getStatut() == StatutTicket.UTILISE) {
            throw new RuntimeException("Ticket déjà utilisé !");
        }
        if (ticket.getStatut() == StatutTicket.ANNULE) {
            throw new RuntimeException("Ticket annulé !");
        }
        if (ticket.getStatut() == StatutTicket.EXPIRE) {
            throw new RuntimeException("Ticket expiré !");
        }

        ticket.setStatut(StatutTicket.UTILISE);
        ticketRepository.save(ticket);

        // Notifier le voyageur
        String voyageurEmail = ticket.getReservation().getVoyageur().getEmail();
        Map<String, Object> ticketData = new HashMap<>();
        ticketData.put("trajetId", ticket.getReservation().getTrajet().getId());
        ticketData.put("nomPassager", ticket.getNomPassager());
        ticketData.put("prenomPassager", ticket.getPrenomPassager());
        ticketData.put("numeroSiege", ticket.getNumeroSiege() != null ? ticket.getNumeroSiege() : "N/A");
        ticketData.put("categorie", ticket.getCategorieTarifaire().name());
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(ticketData);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            payloadJson = "{\"trajetId\":" + ticket.getReservation().getTrajet().getId() + "}";
        }
        wsNotifService.notifierVoyageur(voyageurEmail, "TICKET_VALIDE", ticketData);
        notifOfflineService.creerNotification(voyageurEmail, TypeNotification.TICKET_VALIDE,
                "🎫 Embarquement confirmé — " + ticket.getPrenomPassager() + " " + ticket.getNomPassager() + " — Siège " + ticket.getNumeroSiege(),
                payloadJson);

        // Envoyer une demande d'avis après embarquement
        Map<String, Object> avisData = new HashMap<>();
        avisData.put("trajetId", ticket.getReservation().getTrajet().getId());
        avisData.put("villeDepart", ticket.getReservation().getTrajet().getLigne().getVilleDepart());
        avisData.put("villeArrivee", ticket.getReservation().getTrajet().getLigne().getVilleArrivee());
        avisData.put("compagnieNom", ticket.getReservation().getTrajet().getLigne().getCompagnie().getNom());
        avisData.put("nomPassager", ticket.getNomPassager());
        avisData.put("prenomPassager", ticket.getPrenomPassager());
        String avisPayloadJson;
        try {
            avisPayloadJson = objectMapper.writeValueAsString(avisData);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            avisPayloadJson = "{\"trajetId\":" + ticket.getReservation().getTrajet().getId() + "}";
        }
        notifOfflineService.creerNotification(voyageurEmail, TypeNotification.DEMANDE_AVIS,
                "✍️ Merci d'avoir voyagé avec " + ticket.getReservation().getTrajet().getLigne().getCompagnie().getNom()
                        + " ! Donnez votre avis sur le trajet " + ticket.getReservation().getTrajet().getLigne().getVilleDepart()
                        + " → " + ticket.getReservation().getTrajet().getLigne().getVilleArrivee(),
                avisPayloadJson);

        log.info("Ticket {} validé pour {} — voyageur notifié {}", qrCode, ticket.getNomPassager(), voyageurEmail);

        return Map.of(
                "valide", true,
                "nomPassager", ticket.getNomPassager(),
                "prenomPassager", ticket.getPrenomPassager(),
                "numeroSiege", ticket.getNumeroSiege() != null
                        ? ticket.getNumeroSiege() : "N/A",
                "categorie", ticket.getCategorieTarifaire().name(),
                "enfantSurGenoux", ticket.isEnfantSurGenoux(),
                "message", "Embarquement validé ✅"
        );
    }

    // =========================================================
    // US-36 — T3-18 Scan bagage + émission tickets
    // =========================================================
    @Transactional
    public Map<String, Object> scannerBagage(Long bagageId) {
        Bagage bagage = bagageRepository.findById(bagageId)
                .orElseThrow(() -> new RuntimeException("Bagage non trouvé"));

        if (bagage.getQrCodeBagage() == null) {
            String qrCode = "BAG-" + bagageId + "-" + System.currentTimeMillis();
            bagage.setQrCodeBagage(qrCode);
            bagageRepository.save(bagage);
        }

        Reservation reservation = bagage.getReservation();
        Voyageur voyageur = reservation.getVoyageur();

        log.info("Bagage {} scanné pour voyageur {}", bagageId, voyageur.getEmail());

        return Map.of(
                "bagageId", bagageId,
                "qrCodeBagage", bagage.getQrCodeBagage(),
                "nomVoyageur", voyageur.getNom() + " " + voyageur.getPrenom(),
                "emailVoyageur", voyageur.getEmail(),
                "poidsKg", bagage.getPoidsKg() != null ? bagage.getPoidsKg() : 0,
                "surplusPrix", bagage.getSurplusPrix(),
                "message", "Bagage enregistré — 2 tickets générés"
        );
    }

    // =========================================================
    // US-40 — Scanner bagage à l'arrivée (confirmation identité)
    // =========================================================
    @Transactional
    public Map<String, Object> scannerBagageArrivee(Long bagageId) {
        Bagage bagage = bagageRepository.findById(bagageId)
                .orElseThrow(() -> new RuntimeException("Bagage non trouvé"));

        if (bagage.getQrCodeBagage() == null) {
            throw new RuntimeException("Ce bagage n'a pas été enregistré au départ");
        }

        bagage.setScannéArrivee(true);
        bagageRepository.save(bagage);

        Reservation reservation = bagage.getReservation();
        Voyageur voyageur = reservation.getVoyageur();

        log.info("Bagage {} scanné à l'arrivée pour voyageur {}", bagageId, voyageur.getEmail());

        return Map.of(
                "bagageId", bagageId,
                "qrCodeBagage", bagage.getQrCodeBagage(),
                "nomVoyageur", voyageur.getNom() + " " + voyageur.getPrenom(),
                "emailVoyageur", voyageur.getEmail(),
                "poidsKg", bagage.getPoidsKg() != null ? bagage.getPoidsKg() : 0,
                "surplusPrix", bagage.getSurplusPrix(),
                "valide", true,
                "message", "Identité confirmée — bagage récupéré ✅"
        );
    }

    // =========================================================
    // US-37 — Jalons d'arrêts : Arrivée + Départ + Time Calculator
    // =========================================================

    @Transactional
    public Map<String, Object> arriverArret(Long trajetId, Long arretId, Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        Arret arret = trajet.getLigne().getArrets().stream()
                .filter(a -> a.getId().equals(arretId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Arrêt non trouvé pour ce trajet"));

        // Vérifier si déjà arrivé
        if (jalonValideRepository.existsByTrajetIdAndArretId(trajetId, arretId)) {
            JalonValide existing = jalonValideRepository.findByTrajetIdAndArretId(trajetId, arretId).get();
            if (existing.getArriveeLe() != null) {
                throw new RuntimeException("Déjà arrivé à " + arret.getVille());
            }
        }

        LocalDateTime heureArrivee = LocalDateTime.now();

        // Calcul du retard à l'arrivée
        int retardArrivee = 0;
        if (trajet.getDateDepart() != null && arret.getHeurePrevueOffsetMinutes() != null) {
            LocalDateTime heurePrevue = trajet.getDateDepart()
                    .plusMinutes(arret.getHeurePrevueOffsetMinutes());
            retardArrivee = (int) ChronoUnit.MINUTES.between(heurePrevue, heureArrivee);
        }

        // Mettre à jour le statut du trajet
        if (retardArrivee > 5) {
            trajet.setStatut(StatutTrajet.RETARDE);
            trajet.setRetardMinutes(retardArrivee);
        } else if (trajet.getStatut() == StatutTrajet.PLANIFIE) {
            trajet.setStatut(StatutTrajet.EN_COURS);
        }
        trajetRepository.save(trajet);

        // Créer ou mettre à jour le jalon
        JalonValide jalon = jalonValideRepository.findByTrajetIdAndArretId(trajetId, arretId)
                .orElse(JalonValide.builder()
                        .trajetId(trajetId)
                        .arretId(arretId)
                        .ville(arret.getVille())
                        .ordre(arret.getOrdre())
                        .build());

        jalon.setArriveeLe(heureArrivee);
        jalon.setRetardArriveeMinutes(Math.max(retardArrivee, 0));
        jalonValideRepository.save(jalon);

        // Notifier les voyageurs
        notifierVoyageursTrajet(trajet, "JALON_ARRIVEE", Map.of(
                "trajetId", trajetId,
                "ville", arret.getVille(),
                "arretId", arretId,
                "retardArriveeMinutes", Math.max(retardArrivee, 0)
        ), "🚌 Arrivée à " + arret.getVille() + " — Trajet " + trajet.getLigne().getVilleDepart() + " → " + trajet.getLigne().getVilleArrivee());

        log.info("Arrivée à {} (arrêt #{}) — retard: {}min",
                arret.getVille(), arret.getOrdre(), retardArrivee);

        return Map.of(
                "arretId", arretId,
                "ville", arret.getVille(),
                "ordre", arret.getOrdre(),
                "arriveeLe", heureArrivee.toString(),
                "retardArriveeMinutes", Math.max(retardArrivee, 0),
                "statut", trajet.getStatut().name(),
                "message", "Arrivée à " + arret.getVille() + " enregistrée ✅"
        );
    }

    @Transactional
    public Map<String, Object> departirArret(Long trajetId, Long arretId, Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        Arret arret = trajet.getLigne().getArrets().stream()
                .filter(a -> a.getId().equals(arretId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Arrêt non trouvé pour ce trajet"));

        JalonValide jalon = jalonValideRepository.findByTrajetIdAndArretId(trajetId, arretId)
                .orElseThrow(() -> new RuntimeException("Aucune arrivée enregistrée à " + arret.getVille()
                        + ". Veuillez d'abord cliquer sur 'Arrivé'."));

        if (jalon.getArriveeLe() == null) {
            throw new RuntimeException("Aucune arrivée enregistrée à " + arret.getVille()
                    + ". Veuillez d'abord cliquer sur 'Arrivé'.");
        }

        if (jalon.getDepartLe() != null) {
            throw new RuntimeException("Déjà parti de " + arret.getVille());
        }

        LocalDateTime heureDepart = LocalDateTime.now();

        // Calcul du temps passé à l'arrêt
        long dureeMinutes = ChronoUnit.MINUTES.between(jalon.getArriveeLe(), heureDepart);

        // Calcul du retard au départ
        int retardDepart = 0;
        if (trajet.getDateDepart() != null && arret.getHeurePrevueOffsetMinutes() != null) {
            int dureePause = arret.getDureePauseMinutes() != null ? arret.getDureePauseMinutes() : 0;
            LocalDateTime heureDepartPrevue = trajet.getDateDepart()
                    .plusMinutes(arret.getHeurePrevueOffsetMinutes() + dureePause);
            retardDepart = (int) ChronoUnit.MINUTES.between(heureDepartPrevue, heureDepart);
        }

        jalon.setDepartLe(heureDepart);
        jalon.setDureeStationnementMinutes((int) dureeMinutes);
        jalonValideRepository.save(jalon);

        // Mettre à jour le statut du trajet si retard au départ
        if (retardDepart > 5 && trajet.getStatut() != StatutTrajet.RETARDE) {
            trajet.setStatut(StatutTrajet.RETARDE);
            trajet.setRetardMinutes(retardDepart);
            trajetRepository.save(trajet);
        }

        // Notifier les voyageurs
        notifierVoyageursTrajet(trajet, "JALON_DEPART", Map.of(
                "trajetId", trajetId,
                "ville", arret.getVille(),
                "arretId", arretId,
                "dureeStationnementMinutes", (int) dureeMinutes
        ), "🚌 Départ de " + arret.getVille() + " — Prochain arrêt à venir");

        log.info("Départ de {} (arrêt #{}) — stationné {}min, retard: {}min",
                arret.getVille(), arret.getOrdre(), dureeMinutes, retardDepart);

        return Map.of(
                "arretId", arretId,
                "ville", arret.getVille(),
                "ordre", arret.getOrdre(),
                "arriveeLe", jalon.getArriveeLe().toString(),
                "departLe", heureDepart.toString(),
                "dureeStationnementMinutes", (int) dureeMinutes,
                "retardDepartMinutes", Math.max(retardDepart, 0),
                "statut", trajet.getStatut().name(),
                "message", "Départ de " + arret.getVille() + " enregistré ✅"
        );
    }

    public Map<String, Object> getArretsWithValidation(Long trajetId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));
        List<Arret> arrets = trajet.getLigne().getArrets();
        List<Long> arrives = jalonValideRepository.findArrivedArretIdsByTrajetId(trajetId);
        List<Long> partis = jalonValideRepository.findDepartedArretIdsByTrajetId(trajetId);
        List<Map<String, Object>> jalonsData = jalonValideRepository.findByTrajetIdOrderByOrdreAsc(trajetId)
                .stream().map(j -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("arretId", j.getArretId());
                    m.put("arriveeLe", j.getArriveeLe() != null ? j.getArriveeLe().toString() : null);
                    m.put("departLe", j.getDepartLe() != null ? j.getDepartLe().toString() : null);
                    m.put("retardArriveeMinutes", j.getRetardArriveeMinutes());
                    m.put("dureeStationnementMinutes", j.getDureeStationnementMinutes());
                    return m;
                }).toList();

        return Map.of(
                "arrets", arrets,
                "arrives", arrives,
                "partis", partis,
                "jalons", jalonsData
        );
    }

    // =========================================================
    // US-41 — T3-23 Bouton DÉPART
    // =========================================================
    @Transactional
    public Map<String, Object> declencherDepart(Long trajetId, Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        trajet.setStatut(StatutTrajet.EN_COURS);
        trajetRepository.save(trajet);

        stationnementRepo
                .findByMatriculeAndStatut(
                        trajet.getBus().getMatricule(),
                        StatutStationnement.EN_COURS)
                .ifPresent(stat -> {
                    stat.setHeureSortie(LocalDateTime.now());
                    stat.setStatut(StatutStationnement.TERMINE);

                    long dureeMin = ChronoUnit.MINUTES.between(stat.getHeureEntree(), stat.getHeureSortie());
                    stat.setDureeMinutes((int) dureeMin);

                    if (stat.getQuai() != null) {
                        double heures = dureeMin / 60.0;
                        stat.setMontantFacture(Math.round(
                                heures * stat.getQuai().getTarifHoraire() * 100.0) / 100.0);
                        // Libérer le quai du stationnement
                        Quai q = stat.getQuai();
                        q.setDisponible(true);
                        quaiRepository.save(q);
                    }
                    stationnementRepo.save(stat);
                });

        if (trajet.getQuai() != null) {
            Quai quai = trajet.getQuai();
            quai.setDisponible(true);
            quaiRepository.save(quai);
        }

        String quaiLib = trajet.getQuai() != null
                ? String.valueOf(trajet.getQuai().getNumero()) : "N/A";

        Map<String, Object> adminNotifData = new HashMap<>();
        adminNotifData.put("trajetId", trajetId);
        adminNotifData.put("bus", trajet.getBus().getMatricule());
        adminNotifData.put("quaiLibere", quaiLib);
        adminNotifData.put("compagnie", trajet.getLigne().getCompagnie().getNom());
        wsNotifService.notifierAdmins("TRAJET_DEPART", adminNotifData);

        // — Notifier les admins offline (quai libéré)
        try {
            String adminMsg = "🚍 Quai " + quaiLib + " libéré — Bus " + trajet.getBus().getMatricule()
                    + " (" + trajet.getLigne().getCompagnie().getNom() + ") a démarré vers " + trajet.getLigne().getVilleArrivee();
            String adminPayload = objectMapper.writeValueAsString(adminNotifData);
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notifOfflineService.creerNotification(
                        admin.getEmail(), TypeNotification.QUAI_LIBERE, adminMsg, adminPayload);
            }
        } catch (Exception e) {
            log.warn("Impossible de notifier les admins offline: {}", e.getMessage());
        }

        // Notifier chaque voyageur ayant une réservation sur ce trajet
        List<Reservation> reservations = trajet.getReservations();
        log.info("Trajet {} a {} réservations", trajetId, reservations != null ? reservations.size() : 0);

        Set<String> voyageurEmails = reservations.stream()
                .map(r -> r.getVoyageur().getEmail())
                .collect(Collectors.toSet());

        log.info("Voyageurs à notifier pour le trajet {}: {}", trajetId, voyageurEmails);

        String villeDepart = trajet.getLigne().getVilleDepart();
        String villeArrivee = trajet.getLigne().getVilleArrivee();
        String compagnieNom = trajet.getLigne().getCompagnie().getNom();

        Map<String, Object> notifData = new HashMap<>();
        notifData.put("trajetId", trajetId);
        notifData.put("villeDepart", villeDepart);
        notifData.put("villeArrivee", villeArrivee);
        notifData.put("compagnieNom", compagnieNom);
        notifData.put("dateDepart", trajet.getDateDepart().toString());
        notifData.put("busMatricule", trajet.getBus().getMatricule());
        if (trajet.getQuai() != null) {
            notifData.put("quaiNumero", trajet.getQuai().getNumero());
        }

        String messageNotif = "🚌 Le bus " + compagnieNom + " (" + trajet.getBus().getMatricule() + ")"
                + " a commencé son trajet " + villeDepart + " → " + villeArrivee
                + " prévu le " + trajet.getDateDepart().toLocalDate().toString();

        try {
            String payloadJson;
            try {
                payloadJson = objectMapper.writeValueAsString(notifData);
            } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
                payloadJson = "{\"trajetId\":" + trajetId + "}";
            }

            for (String email : voyageurEmails) {
                wsNotifService.notifierVoyageur(email, "TRAJET_DEMARRE", notifData);
                notifOfflineService.creerNotification(email, TypeNotification.TRAJET_DEMARRE, messageNotif, payloadJson);
            }

            log.info("Départ déclenché pour trajet {} — {} voyageurs notifiés", trajetId, voyageurEmails.size());
        } catch (Exception e) {
            log.error("Erreur lors de la notification des voyageurs pour le trajet {}: {}", trajetId, e.getMessage());
        }

        // Notifier les responsables de la compagnie
        try {
            Long compagnieId = trajet.getLigne().getCompagnie().getId();
            responsableNotificationHelper.notifierResponsables(
                    compagnieId, "TRAJET_DEMARRE", TypeNotification.TRAJET_DEMARRE,
                    "🚌 Trajet démarré — " + villeDepart + " → " + villeArrivee + " par " + compagnieNom + " (" + trajet.getBus().getMatricule() + ")",
                    notifData
            );
        } catch (Exception e) {
            log.error("Erreur notification responsables pour trajet {}: {}", trajetId, e.getMessage());
        }

        return Map.of(
                "trajetId", trajetId,
                "statut", "EN_COURS",
                "quaiLibere", trajet.getQuai() != null
                        ? trajet.getQuai().getNumero() : "N/A",
                "message", "Départ enregistré ✅"
        );
    }

    // =========================================================
    // US-33b — Terminer un trajet
    // =========================================================
    @Transactional
    public Map<String, Object> terminerTrajet(Long trajetId, Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        if (!trajet.getChauffeur().getId().equals(chauffeurId)) {
            throw new RuntimeException("Ce trajet ne vous est pas attribué");
        }

        trajet.setStatut(StatutTrajet.TERMINE);
        trajet.setDateArriveeReelle(LocalDateTime.now());
        trajetRepository.save(trajet);

        wsNotifService.notifierAdmins("TRAJET_TERMINE", Map.of(
                "trajetId", trajetId,
                "bus", trajet.getBus().getMatricule()
        ));

        // Notifier les voyageurs
        notifierVoyageursTrajet(trajet, "TRAJET_TERMINE", Map.of(
                "trajetId", trajetId,
                "dateArrivee", LocalDateTime.now().toString()
        ), "✅ Trajet " + trajet.getLigne().getVilleDepart() + " → " + trajet.getLigne().getVilleArrivee() + " terminé. Merci d'avoir voyagé avec " + trajet.getLigne().getCompagnie().getNom() + " !");

        log.info("Trajet {} terminé par chauffeur {}", trajetId, chauffeurId);

        return Map.of(
                "trajetId", trajetId,
                "statut", "TERMINE",
                "dateArriveeReelle", LocalDateTime.now().toString(),
                "message", "Trajet terminé ✅"
        );
    }

    // =========================================================
// US-42 — Signalement incident
// =========================================================
    public Incident signalerIncident(IncidentRequest request, Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        Chauffeur chauffeur = chauffeurRepository.findById(chauffeurId)
                .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé avec ID: " + chauffeurId));

        Incident incident = new Incident();
        incident.setTrajet(trajet);
        incident.setChauffeur(chauffeur);
        incident.setType(request.getType());
        incident.setDescription(request.getDescription());
        incident.setResolu(false);

        Incident saved = incidentRepository.save(incident);

        // ✅ Changer le statut du trajet selon le type d'incident
        if ("PANNE".equals(request.getType()) || "ACCIDENT".equals(request.getType())) {
            trajet.setStatut(StatutTrajet.ANNULE);
            log.info("Trajet {} annulé suite à un incident de type {}", request.getTrajetId(), request.getType());
        } else if ("RETARD".equals(request.getType())) {
            trajet.setStatut(StatutTrajet.RETARDE);
            log.info("Trajet {} marqué comme retardé", request.getTrajetId());
        }
        trajetRepository.save(trajet);

        wsNotifService.notifierAdmins("INCIDENT_SIGNALE", Map.of(
                "trajetId", request.getTrajetId(),
                "type", request.getType(),
                "description", request.getDescription()
        ));

        // Notifier les responsables de la compagnie
        try {
            Long compagnieId = trajet.getLigne().getCompagnie().getId();
            Map<String, Object> incidentNotifData = new HashMap<>();
            incidentNotifData.put("trajetId", request.getTrajetId());
            incidentNotifData.put("type", request.getType());
            incidentNotifData.put("description", request.getDescription());
            incidentNotifData.put("chauffeurNom", chauffeur.getPrenom() + " " + chauffeur.getNom());
            incidentNotifData.put("villeDepart", trajet.getLigne().getVilleDepart());
            incidentNotifData.put("villeArrivee", trajet.getLigne().getVilleArrivee());
            responsableNotificationHelper.notifierResponsables(
                    compagnieId, "INCIDENT_SIGNALE", TypeNotification.INCIDENT_SIGNALE,
                    "⚠️ Incident signalé — " + request.getType() + " sur le trajet "
                            + trajet.getLigne().getVilleDepart() + " → " + trajet.getLigne().getVilleArrivee()
                            + " : " + request.getDescription(),
                    incidentNotifData
            );
        } catch (Exception e) {
            log.error("Erreur notification responsables pour incident: {}", e.getMessage());
        }

        log.info("Incident signalé: {} pour trajet {} par chauffeur {}",
                request.getType(), request.getTrajetId(), chauffeurId);
        return saved;
    }

    // =========================================================
    // US-34 — Manifeste de voyage
    // =========================================================
    public Map<String, Object> getManifeste(Long trajetId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        List<Map<String, Object>> passagers = trajet.getReservations()
                .stream()
                .flatMap(r -> r.getTickets().stream())
                .map(ticket -> Map.<String, Object>of(
                        "nom", ticket.getNomPassager(),
                        "prenom", ticket.getPrenomPassager(),
                        "siege", ticket.getNumeroSiege() != null
                                ? ticket.getNumeroSiege() : "N/A",
                        "categorie", ticket.getCategorieTarifaire().name(),
                        "statut", ticket.getStatut().name(),
                        "enfantSurGenoux", ticket.isEnfantSurGenoux()
                ))
                .toList();

        return Map.of(
                "trajetId", trajetId,
                "ligne", trajet.getLigne().getVilleDepart()
                        + " → " + trajet.getLigne().getVilleArrivee(),
                "dateDepart", trajet.getDateDepart().toString(),
                "nbPassagers", passagers.size(),
                "passagers", passagers
        );
    }
    // =========================================================
// Historique des trajets du chauffeur
// =========================================================
    public List<TrajetResponseDTO> getHistoriqueTrajets(Long chauffeurId) {
        return trajetRepository
                .findAll()
                .stream()
                .filter(t -> t.getChauffeur() != null
                        && t.getChauffeur().getId().equals(chauffeurId)
                        && (t.getStatut() == StatutTrajet.TERMINE
                        || t.getStatut() == StatutTrajet.ANNULE))
                .sorted((t1, t2) -> t2.getDateDepart().compareTo(t1.getDateDepart()))
                .map(this::toTrajetDTO)
                .toList();
    }
}