package ma.emsi.gare.service;

import com.google.zxing.*;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
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

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
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

    // =========================================================
    // US-33 — Trajet du jour du chauffeur
    // =========================================================
    public List<Trajet> getTrajetsJour(Long chauffeurId) {
        LocalDateTime debutJour = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(1);

        return trajetRepository
                .findByDateDepartBetweenAndStatutIn(
                        debutJour, finJour,
                        List.of(StatutTrajet.PLANIFIE, StatutTrajet.EN_COURS))
                .stream()
                .filter(t -> t.getChauffeur() != null
                        && t.getChauffeur().getId().equals(chauffeurId))
                .toList();
    }

    // =========================================================
    // US-35 — T3-16 Validation QR Code ticket
    // =========================================================
    @Transactional
    public Map<String, Object> validerTicketQR(String qrCode) {
        Ticket ticket = ticketRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new RuntimeException("Ticket invalide"));

        // Vérifications
        if (ticket.getStatut() == StatutTicket.UTILISE) {
            throw new RuntimeException("Ticket déjà utilisé !");
        }
        if (ticket.getStatut() == StatutTicket.ANNULE) {
            throw new RuntimeException("Ticket annulé !");
        }
        if (ticket.getStatut() == StatutTicket.EXPIRE) {
            throw new RuntimeException("Ticket expiré !");
        }

        // Marquer comme utilisé
        ticket.setStatut(StatutTicket.UTILISE);
        ticketRepository.save(ticket);

        log.info("Ticket {} validé pour {}",
                qrCode, ticket.getNomPassager());

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

        // Générer QR code bagage si pas encore fait
        if (bagage.getQrCodeBagage() == null) {
            String qrCode = "BAG-" + bagageId + "-"
                    + System.currentTimeMillis();
            bagage.setQrCodeBagage(qrCode);
            bagageRepository.save(bagage);
        }

        Reservation reservation = bagage.getReservation();
        Voyageur voyageur = reservation.getVoyageur();

        log.info("Bagage {} scanné pour voyageur {}",
                bagageId, voyageur.getEmail());

        return Map.of(
                "bagageId", bagageId,
                "qrCodeBagage", bagage.getQrCodeBagage(),
                "nomVoyageur", voyageur.getNom() + " " + voyageur.getPrenom(),
                "emailVoyageur", voyageur.getEmail(),
                "poidsKg", bagage.getPoidsKg() != null
                        ? bagage.getPoidsKg() : 0,
                "surplusPrix", bagage.getSurplusPrix(),
                "message", "Bagage enregistré — 2 tickets générés"
        );
    }

    // =========================================================
    // US-37 — T3-20 Validation jalon d'arrêt
    // =========================================================
    @Transactional
    public Map<String, Object> validerJalon(JalonRequest request,
                                            Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        LocalDateTime heureReelle = LocalDateTime.now();

        // Calculer le retard
        int retardMinutes = 0;
        if (trajet.getDateDepart() != null) {
            // Calcul basé sur l'offset prévu de l'arrêt
            Arret arretPrevu = trajet.getLigne().getArrets().stream()
                    .filter(a -> a.getVille().equals(request.getVille()))
                    .findFirst().orElse(null);

            if (arretPrevu != null
                    && arretPrevu.getHeurePrevueOffsetMinutes() != null) {
                LocalDateTime heurePrevue = trajet.getDateDepart()
                        .plusMinutes(arretPrevu.getHeurePrevueOffsetMinutes());
                retardMinutes = (int) ChronoUnit.MINUTES.between(
                        heurePrevue, heureReelle);
            }
        }

        // Mettre à jour le statut du trajet
        if (retardMinutes > 0) {
            trajet.setStatut(StatutTrajet.RETARDE);
            trajet.setRetardMinutes(retardMinutes);
        } else {
            trajet.setStatut(StatutTrajet.EN_COURS);
        }
        trajetRepository.save(trajet);

        // Notifier tous les voyageurs du trajet via WebSocket + offline
        final int retardFinal = retardMinutes;
        trajet.getReservations().forEach(reservation -> {
            String email = reservation.getVoyageur().getEmail();

            // WebSocket (si connecté)
            wsNotifService.notifierVoyageur(email, "JALON_VALIDE", Map.of(
                    "ville", request.getVille(),
                    "heureReelle", heureReelle.toString(),
                    "retardMinutes", retardFinal,
                    "trajetId", request.getTrajetId()
            ));

            // Notification offline (si déconnecté)
            if (retardFinal > 0) {
                notifOfflineService.creerNotification(
                        email,
                        TypeNotification.RETARD,
                        "Votre bus a " + retardFinal + " min de retard à "
                                + request.getVille(),
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
    public Map<String, Object> declencherDepart(Long trajetId,
                                                Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        // 1. Mettre à jour le statut du trajet
        trajet.setStatut(StatutTrajet.EN_COURS);
        trajet.setDateArriveePrevue(trajet.getDateArriveePrevue());
        trajetRepository.save(trajet);

        // 2. Terminer le stationnement OCR
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
                                heures * stat.getQuai().getTarifHoraire()
                                        * 100.0) / 100.0);
                    }
                    stationnementRepo.save(stat);
                });

        // 3. Libérer le quai
        if (trajet.getQuai() != null) {
            Quai quai = trajet.getQuai();
            quai.setDisponible(true);
            quaiRepository.save(quai);
        }

        // 4. Notifier l'admin
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
    public Incident signalerIncident(IncidentRequest request,
                                     Long chauffeurId) {
        Trajet trajet = trajetRepository.findById(request.getTrajetId())
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        Incident incident = new Incident();
        incident.setTrajet(trajet);
        incident.setType(request.getType());
        incident.setDescription(request.getDescription());
        incident.setResolu(false);

        Incident saved = incidentRepository.save(incident);

        // Notifier les admins
        wsNotifService.notifierAdmins("INCIDENT_SIGNALE", Map.of(
                "trajetId", request.getTrajetId(),
                "type", request.getType(),
                "description", request.getDescription()
        ));

        // Si c'est un retard, mettre à jour le statut du trajet
        if ("RETARD".equals(request.getType())) {
            trajet.setStatut(StatutTrajet.RETARDE);
            trajetRepository.save(trajet);
        }

        log.info("Incident signalé: {} pour trajet {}",
                request.getType(), request.getTrajetId());
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
}