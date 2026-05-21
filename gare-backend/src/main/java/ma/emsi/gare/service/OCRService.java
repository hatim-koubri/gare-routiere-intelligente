package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.request.OCRCorrectionRequest;
import ma.emsi.gare.dto.response.OCRDetectionResponse;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutStationnement;
import ma.emsi.gare.enums.StatutTrajet;
import ma.emsi.gare.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OCRService {

    private final BusRepository busRepository;
    private final QuaiRepository quaiRepository;
    private final StationnementOCRRepository stationnementRepo;
    private final WebSocketNotificationService wsNotifService;
    private final NotificationOfflineService notifOfflineService;
    private final ImagePreprocessingService imagePreprocessingService;
    private final TesseractOCRService tesseractOCRService;
    private final TrajetRepository trajetRepository;
    private final ResponsableNotificationHelper responsableNotificationHelper;
    private final UserRepository userRepository;

    // =========================================================
    // T3-01/T3-02/T3-03 — Traitement image OCR
    // (Upload image → prétraitement → Tesseract → extraction matricule)
    // =========================================================
    @Transactional
    public OCRDetectionResponse traiterImageOCR(
            MultipartFile image,
            String imageUrl) {

        log.info(
                "Traitement image OCR : {}",
                image.getOriginalFilename());

        // ==========================================
        // TESSERACT OCR
        // ==========================================

        try {

            BufferedImage processed = imagePreprocessingService
                    .preprocessImage(image);

            String matriculeExtrait = tesseractOCRService
                    .extraireMatricule(processed);

            // IMPORTANT
            log.info(
                    "OCR RESULT = {}",
                    matriculeExtrait);

            // SI OCR REUSSI
            if (matriculeExtrait != null
                    && !matriculeExtrait.isBlank()) {

                log.info(
                        "OCR Tesseract réussi : {}",
                        matriculeExtrait);

                return traiterMatriculeExtrait(
                        matriculeExtrait,
                        imageUrl);
            }

        } catch (Throwable e) {

            log.warn(
                    "Tesseract OCR échoué (Erreur système ou mémoire) : {}",
                    e.getMessage());
        }

        // ==========================================
        // FALLBACK
        // ==========================================

        String matriculeExtrait = simulerExtractionOCR(image);

        log.info(
                "Fallback RESULT = {}",
                matriculeExtrait);

        // SI AUCUN MATRICULE
        if (matriculeExtrait == null
                || matriculeExtrait.isBlank()) {

            return traiterPlaquillisible(
                    imageUrl);
        }

        // FALLBACK OK
        return traiterMatriculeExtrait(
                matriculeExtrait,
                imageUrl);
    }

    // =========================================================
    // T3-04 — Identification bus par matricule + T3-05 Attribution quai
    // T3-06 — Démarrage facturation + T3-08 Gestion plaque inconnue
    // =========================================================
    @Transactional
    public OCRDetectionResponse traiterMatriculeExtrait(
            String matricule, String imageUrl) {

        // T3-04 — Chercher le bus dans la BDD
        Optional<Bus> busOpt = busRepository.findByMatricule(matricule);

        if (busOpt.isEmpty()) {
            return traiterPlaqueinconnue(matricule, imageUrl);
        }

        Bus bus = busOpt.get();
        Compagnie compagnie = bus.getCompagnie();

        // T3-05 — Attribuer un quai libre
        Quai quaiAttribue = attribuerQuaiLibre(compagnie.getId());

        // T3-06 — Démarrer la facturation
        StationnementOCR stationnement = demarrerFacturation(
                matricule, bus, quaiAttribue);

        // T3-07 — Notifier via WebSocket
        wsNotifService.broadcastOCRDetection(matricule, "DETECTE");
        Map<String, Object> adminData = Map.of(
                "matricule", matricule,
                "compagnie", compagnie.getNom(),
                "quai", quaiAttribue != null ? quaiAttribue.getNumero() : "N/A",
                "stationnementId", stationnement.getId());
        wsNotifService.notifierAdmins("BUS_ARRIVE", adminData);

        // — Créer les notifications offline pour chaque admin
        try {
            String adminMessage = "Bus " + matricule + " entré en gare — Quai " + (quaiAttribue != null ? quaiAttribue.getNumero() : "N/A") + " — " + compagnie.getNom();
            String adminPayload = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(adminData);
            List<ma.emsi.gare.entity.User> admins = userRepository.findByRole(ma.emsi.gare.enums.Role.ADMIN);
            for (ma.emsi.gare.entity.User admin : admins) {
                notifOfflineService.creerNotification(
                        admin.getEmail(),
                        ma.emsi.gare.enums.TypeNotification.BUS_ARRIVE,
                        adminMessage,
                        adminPayload);
            }
        } catch (Exception e) {
            log.warn("Impossible de créer les notifications offline pour les admins: {}", e.getMessage());
        }

        // — Notifier les responsables de la compagnie
        Map<String, Object> responsableData = new HashMap<>();
        responsableData.put("matricule", matricule);
        responsableData.put("compagnie", compagnie.getNom());
        responsableData.put("quai", quaiAttribue != null ? quaiAttribue.getNumero() : "N/A");
        responsableData.put("stationnementId", stationnement.getId());
        responsableNotificationHelper.notifierResponsables(
                compagnie.getId(),
                "BUS_ARRIVE",
                ma.emsi.gare.enums.TypeNotification.BUS_ARRIVE,
                "Bus " + matricule + " entré en gare — Quai " + (quaiAttribue != null ? quaiAttribue.getNumero() : "N/A"),
                responsableData);

        // — Trouver les trajets du jour de ce bus
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime debutJour = maintenant.toLocalDate().atStartOfDay();
        LocalDateTime finJour = debutJour.plusDays(1);
        List<Trajet> trajetsDuJour = trajetRepository
                .findByBusIdAndDateDepartBetweenAndStatutIn(
                        bus.getId(), debutJour, finJour,
                        List.of(StatutTrajet.PLANIFIE, StatutTrajet.EN_COURS, StatutTrajet.RETARDE));

        // T3-29 — Notifier le chauffeur du trajet actif pour ce bus
        try {
            for (Trajet t : trajetsDuJour) {
                if (t.getChauffeur() != null) {
                    wsNotifService.notifierChauffeur(
                            t.getChauffeur().getId(),
                            "QUAI_ATTRIBUE",
                            Map.of(
                                    "trajetId", t.getId(),
                                    "matricule", matricule,
                                    "quai", quaiAttribue != null ? quaiAttribue.getNumero() : "N/A",
                                    "compagnie", compagnie.getNom(),
                                    "villeDepart", t.getLigne().getVilleDepart(),
                                    "villeArrivee", t.getLigne().getVilleArrivee()));
                    log.info("Chauffeur {} notifié pour le quai {} (trajet {})",
                            t.getChauffeur().getId(),
                            quaiAttribue != null ? quaiAttribue.getNumero() : "N/A",
                            t.getId());
                }
            }
        } catch (Exception e) {
            log.warn("Impossible de notifier le chauffeur: {}", e.getMessage());
        }

        // — Notifier les voyageurs réservés sur les trajets du jour de ce bus
        try {
            int totalVoyageursNotifies = 0;
            for (Trajet t : trajetsDuJour) {
                if (t.getReservations() == null || t.getReservations().isEmpty()) continue;

                String qNum = quaiAttribue != null ? String.valueOf(quaiAttribue.getNumero()) : "N/A";
                String msg = "🚌 Bus " + matricule + " (" + compagnie.getNom() + ") entré en gare — Quai " + qNum;

                Map<String, Object> voyageurData = Map.of(
                        "matricule", matricule,
                        "compagnie", compagnie.getNom(),
                        "quai", qNum,
                        "trajetId", t.getId(),
                        "villeDepart", t.getLigne().getVilleDepart(),
                        "villeArrivee", t.getLigne().getVilleArrivee(),
                        "dateDepart", t.getDateDepart().toString(),
                        "message", msg
                );
                String payloadJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(voyageurData);

                for (Reservation r : t.getReservations()) {
                    String email = r.getVoyageur().getEmail();
                    wsNotifService.notifierVoyageur(email, "BUS_EN_GARE", voyageurData);
                    notifOfflineService.creerNotification(
                            email, ma.emsi.gare.enums.TypeNotification.BUS_ARRIVE, msg, payloadJson);
                    totalVoyageursNotifies++;
                }
            }
            if (totalVoyageursNotifies > 0) {
                log.info("{} voyageurs notifiés de l'arrivée en gare du bus {}", totalVoyageursNotifies, matricule);
            }
        } catch (Exception e) {
            log.warn("Impossible de notifier les voyageurs: {}", e.getMessage());
        }

        log.info("Bus {} détecté → Quai {} → Facturation démarrée",
                matricule,
                quaiAttribue != null ? quaiAttribue.getNumero() : "Aucun");

        return OCRDetectionResponse.builder()
                .matricule(matricule)
                .statut("DETECTE")
                .stationnementId(stationnement.getId())
                .quaiAttribue(quaiAttribue != null
                        ? quaiAttribue.getNumero()
                        : null)
                .compagnie(compagnie.getNom())
                .message("Bus détecté et quai attribué avec succès")
                .succès(true)
                .build();
    }

    // =========================================================
    // T3-09 — Correction manuelle OCR
    // =========================================================
    @Transactional
    public OCRDetectionResponse corrigerOCR(Long stationnementId,
            OCRCorrectionRequest request) {
        StationnementOCR stat = stationnementRepo.findById(stationnementId)
                .orElseThrow(() -> new RuntimeException(
                        "Stationnement non trouvé"));

        // Mettre à jour le matricule corrigé
        stat.setMatricule(request.getMatricule());
        stat.setCorrectionManuelle(true);
        stat.setStatut(StatutStationnement.EN_COURS);

        if (request.getHeureEntree() != null) {
            stat.setHeureEntree(request.getHeureEntree());
        }

        // Recalculer si heure de sortie fournie
        if (request.getHeureSortie() != null) {
            stat.setHeureSortie(request.getHeureSortie());
            double montant = calculerMontant(stat);
            stat.setMontantFacture(montant);
            stat.setStatut(StatutStationnement.TERMINE);
        }

        // Attribuer un quai si corrigé
        if (request.getQuaiId() != null) {
            Quai quai = quaiRepository.findById(request.getQuaiId())
                    .orElseThrow(() -> new RuntimeException("Quai non trouvé"));
            stat.setQuai(quai);
        }

        stationnementRepo.save(stat);

        // Identifier le bus avec le matricule corrigé
        Optional<Bus> busOpt = busRepository
                .findByMatricule(request.getMatricule());
        if (busOpt.isPresent()) {
            stat.setCompagnie(busOpt.get().getCompagnie());
            stationnementRepo.save(stat);
        }

        log.info("Correction OCR: {} → {}", stationnementId,
                request.getMatricule());

        return OCRDetectionResponse.builder()
                .matricule(request.getMatricule())
                .statut("CORRIGE")
                .stationnementId(stat.getId())
                .message("Correction appliquée avec succès")
                .succès(true)
                .build();
    }

    // =========================================================
    // T3-23 — Bouton DÉPART : fin facturation + génération facture
    // =========================================================
    @Transactional
    public StationnementOCR terminerStationnement(Long stationnementId) {
        StationnementOCR stat = stationnementRepo.findById(stationnementId)
                .orElseThrow(() -> new RuntimeException(
                        "Stationnement non trouvé"));

        stat.setHeureSortie(LocalDateTime.now());
        stat.setStatut(StatutStationnement.TERMINE);

        long dureeMinutes = java.time.temporal.ChronoUnit.MINUTES.between(stat.getHeureEntree(), stat.getHeureSortie());
        stat.setDureeMinutes((int) dureeMinutes);

        double montant = calculerMontant(stat);
        stat.setMontantFacture(montant);

        // Libérer le quai
        if (stat.getQuai() != null) {
            Quai quai = stat.getQuai();
            quai.setDisponible(true);
            quaiRepository.save(quai);
        }

        StationnementOCR saved = stationnementRepo.save(stat);

        // Notifier l'admin
        Map<String, Object> busPartiData = Map.of(
                "matricule", stat.getMatricule(),
                "montant", montant,
                "stationnementId", stationnementId,
                "quai", stat.getQuai() != null ? stat.getQuai().getNumero() : "N/A",
                "duree", stat.getDureeMinutes() != null ? stat.getDureeMinutes() : 0);
        wsNotifService.notifierAdmins("BUS_PARTI", busPartiData);

        // — Créer les notifications offline pour chaque admin
        try {
            String adminMessage = "Bus " + stat.getMatricule() + " parti — Facture: " + montant + " MAD — Quai " + (stat.getQuai() != null ? stat.getQuai().getNumero() : "N/A");
            String adminPayload = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(busPartiData);
            List<ma.emsi.gare.entity.User> admins = userRepository.findByRole(ma.emsi.gare.enums.Role.ADMIN);
            for (ma.emsi.gare.entity.User admin : admins) {
                notifOfflineService.creerNotification(
                        admin.getEmail(),
                        ma.emsi.gare.enums.TypeNotification.BUS_ARRIVE,
                        adminMessage,
                        adminPayload);
            }
        } catch (Exception e) {
            log.warn("Impossible de créer les notifications offline pour les admins (BUS_PARTI): {}", e.getMessage());
        }

        log.info("Bus {} parti → Montant facturé: {} MAD",
                stat.getMatricule(), montant);
        return saved;
    }

    // =========================================================
    // Méthodes privées
    // =========================================================

    private Quai attribuerQuaiLibre(Long compagnieId) {
        // D'abord chercher un quai disponible attribué à cette compagnie
        List<Quai> quaisCompagnie = quaiRepository.findByCompagnieId(compagnieId);

        Optional<Quai> quaiDispo = quaisCompagnie.stream()
                .filter(Quai::isDisponible)
                .findFirst();

        if (quaiDispo.isPresent()) {
            Quai quai = quaiDispo.get();
            quai.setDisponible(false);
            return quaiRepository.save(quai);
        }

        // Si aucun quai de la compagnie n'est disponible,
        // chercher un quai libre non attribué (quai global)
        List<Quai> quaisLibres = quaiRepository.findByDisponibleTrue();
        Optional<Quai> quaiGlobal = quaisLibres.stream()
                .filter(q -> q.getCompagnie() == null)
                .findFirst();

        if (quaiGlobal.isPresent()) {
            Quai quai = quaiGlobal.get();
            quai.setDisponible(false);
            log.info("Quai global {} attribué temporairement à compagnie {}",
                    quai.getNumero(), compagnieId);
            return quaiRepository.save(quai);
        }

        log.warn("Aucun quai disponible pour compagnie {}", compagnieId);
        return null;
    }

    private StationnementOCR demarrerFacturation(String matricule,
            Bus bus,
            Quai quai) {
        StationnementOCR stat = new StationnementOCR();
        stat.setMatricule(matricule);
        stat.setCompagnie(bus.getCompagnie());
        stat.setQuai(quai);
        stat.setHeureEntree(LocalDateTime.now());
        stat.setStatut(StatutStationnement.EN_COURS);
        stat.setCorrectionManuelle(false);
        return stationnementRepo.save(stat);
    }

    private OCRDetectionResponse traiterPlaqueinconnue(String matricule,
            String imageUrl) {
        StationnementOCR stat = new StationnementOCR();
        stat.setMatricule(matricule != null ? matricule : "INCONNU");
        stat.setHeureEntree(LocalDateTime.now());
        stat.setStatut(StatutStationnement.CORRECTION_MANUELLE);
        stat.setCorrectionManuelle(true);
        stat.setImageEntreeUrl(imageUrl);
        stationnementRepo.save(stat);

        // ✅ Fix : éviter null dans Map.of()
        Map<String, Object> notifData = new HashMap<>();
        notifData.put("matricule", matricule != null ? matricule : "ILLISIBLE");
        notifData.put("stationnementId", stat.getId());
        notifData.put("imageUrl", imageUrl != null ? imageUrl : "");

        wsNotifService.notifierAdmins("PLAQUE_INCONNUE", notifData);

        log.warn("Plaque inconnue détectée: {}", matricule);

        return OCRDetectionResponse.builder()
                .matricule(matricule)
                .statut("INCONNU")
                .stationnementId(stat.getId())
                .message("Plaque non reconnue — correction manuelle requise")
                .succès(false)
                .build();
    }

    private OCRDetectionResponse traiterPlaquillisible(String imageUrl) {
        StationnementOCR stat = new StationnementOCR();
        stat.setMatricule("ILLISIBLE");
        stat.setHeureEntree(LocalDateTime.now());
        stat.setStatut(StatutStationnement.CORRECTION_MANUELLE);
        stat.setCorrectionManuelle(true);
        stat.setImageEntreeUrl(imageUrl);
        stationnementRepo.save(stat);

        wsNotifService.notifierAdmins("PLAQUE_ILLISIBLE", Map.of(
                "message", "Plaque illisible — intervention manuelle requise",
                "stationnementId", stat.getId(),
                "imageUrl", imageUrl != null ? imageUrl : ""));

        return OCRDetectionResponse.builder()
                .matricule("ILLISIBLE")
                .statut("ILLISIBLE")
                .stationnementId(stat.getId())
                .message("Image illisible — correction manuelle requise")
                .succès(false)
                .build();
    }

    // =========================================================
    // FALLBACK OCR
    // =========================================================

    private String simulerExtractionOCR(MultipartFile image) {

        String filename = image.getOriginalFilename();

        log.info("FILENAME = {}", filename);

        if (filename == null) {
            return null;
        }

        filename = filename.toUpperCase();

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "(\\d{1,5}-[A-Z]-\\d{1,3})");

        java.util.regex.Matcher matcher = pattern.matcher(filename);

        if (matcher.find()) {

            String matricule = matcher.group(1);

            log.info("MATRICULE FALLBACK = {}", matricule);

            return matricule;
        }

        log.warn("Aucun matricule trouvé dans filename");

        return null;
    }

    private double calculerMontant(StationnementOCR stat) {
        if (stat.getHeureEntree() == null || stat.getHeureSortie() == null) {
            return 0.0;
        }
        if (stat.getQuai() == null)
            return 0.0;

        long minutes = java.time.temporal.ChronoUnit.MINUTES.between(
                stat.getHeureEntree(), stat.getHeureSortie());
        double heures = minutes / 60.0;
        double montant = heures * stat.getQuai().getTarifHoraire();
        return Math.round(montant * 100.0) / 100.0;
    }
}