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
import ma.emsi.gare.enums.StatutStationnement;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

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
    // =========================================================
    // US-33 — Trajet du jour du chauffeur
    // =========================================================
    public List<TrajetResponseDTO> getTrajetsJour(Long chauffeurId) {
        LocalDateTime debutJour = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(1);

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

        log.info("Ticket {} validé pour {}", qrCode, ticket.getNomPassager());

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
    // US-37 — T3-20 Validation jalon d'arrêt
    // =========================================================
    @Transactional
    public Map<String, Object> validerJalon(JalonRequest request, Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        LocalDateTime heureReelle = LocalDateTime.now();
        int retardMinutes = 0;

        if (trajet.getDateDepart() != null) {
            Arret arretPrevu = trajet.getLigne().getArrets().stream()
                    .filter(a -> a.getVille().equals(request.getVille()))
                    .findFirst().orElse(null);

            if (arretPrevu != null && arretPrevu.getHeurePrevueOffsetMinutes() != null) {
                LocalDateTime heurePrevue = trajet.getDateDepart()
                        .plusMinutes(arretPrevu.getHeurePrevueOffsetMinutes());
                retardMinutes = (int) ChronoUnit.MINUTES.between(heurePrevue, heureReelle);
            }
        }

        if (retardMinutes > 0) {
            trajet.setStatut(StatutTrajet.RETARDE);
            trajet.setRetardMinutes(retardMinutes);
        } else {
            trajet.setStatut(StatutTrajet.EN_COURS);
        }
        trajetRepository.save(trajet);

        final int retardFinal = retardMinutes;
        trajet.getReservations().forEach(reservation -> {
            String email = reservation.getVoyageur().getEmail();

            wsNotifService.notifierVoyageur(email, "JALON_VALIDE", Map.of(
                    "ville", request.getVille(),
                    "heureReelle", heureReelle.toString(),
                    "retardMinutes", retardFinal,
                    "trajetId", request.getTrajetId()
            ));

            if (retardFinal > 0) {
                notifOfflineService.creerNotification(
                        email,
                        TypeNotification.RETARD,
                        "Votre bus a " + retardFinal + " min de retard à " + request.getVille(),
                        "{\"trajetId\":" + request.getTrajetId()
                                + ", \"ville\":\"" + request.getVille() + "\"}"
                );
            }
        });

        log.info("Jalon validé: {} à {} (retard: {}min)",
                request.getVille(), heureReelle, retardMinutes);

        return Map.of(
                "ville", request.getVille(),
                "heureReelle", heureReelle.toString(),
                "retardMinutes", retardMinutes,
                "statut", trajet.getStatut().name(),
                "message", "Jalon validé ✅"
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
                    if (stat.getQuai() != null) {
                        double heures = ChronoUnit.MINUTES.between(
                                stat.getHeureEntree(),
                                stat.getHeureSortie()) / 60.0;
                        stat.setMontantFacture(Math.round(
                                heures * stat.getQuai().getTarifHoraire() * 100.0) / 100.0);
                    }
                    stationnementRepo.save(stat);
                });

        if (trajet.getQuai() != null) {
            Quai quai = trajet.getQuai();
            quai.setDisponible(true);
            quaiRepository.save(quai);
        }

        wsNotifService.notifierAdmins("TRAJET_DEPART", Map.of(
                "trajetId", trajetId,
                "bus", trajet.getBus().getMatricule()
        ));

        log.info("Départ déclenché pour trajet {}", trajetId);

        return Map.of(
                "trajetId", trajetId,
                "statut", "EN_COURS",
                "quaiLibere", trajet.getQuai() != null
                        ? trajet.getQuai().getNumero() : "N/A",
                "message", "Départ enregistré ✅"
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