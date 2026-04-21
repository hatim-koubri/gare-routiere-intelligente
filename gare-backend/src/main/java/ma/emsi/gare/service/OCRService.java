package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.request.OCRCorrectionRequest;
import ma.emsi.gare.dto.response.OCRDetectionResponse;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutStationnement;
import ma.emsi.gare.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
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

    // =========================================================
    // T3-01/T3-02/T3-03 — Traitement image OCR
    // (Simulation académique : upload image → extraction matricule)
    // =========================================================
    @Transactional
    public OCRDetectionResponse traiterImageOCR(MultipartFile image) {
        log.info("Traitement image OCR : {}", image.getOriginalFilename());

        // SIMULATION : Dans un vrai déploiement, ici on appelle
        // le microservice Python YOLOv8 + Tesseract via HTTP
        // Pour le contexte académique : on simule l'extraction
        String matriculeExtrait = simulerExtractionOCR(image);

        if (matriculeExtrait == null || matriculeExtrait.isBlank()) {
            return traiterPlaquillisible();
        }

        return traiterMatriculeExtrait(matriculeExtrait, null);
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
        wsNotifService.notifierAdmins("BUS_ARRIVE", Map.of(
                "matricule", matricule,
                "compagnie", compagnie.getNom(),
                "quai", quaiAttribue != null ? quaiAttribue.getNumero() : "N/A"
        ));

        // T3-29 — Notifier le chauffeur si on peut l'identifier
        // (sera complété au Sprint 3 lors du scan QR)

        log.info("Bus {} détecté → Quai {} → Facturation démarrée",
                matricule,
                quaiAttribue != null ? quaiAttribue.getNumero() : "Aucun");

        return OCRDetectionResponse.builder()
                .matricule(matricule)
                .statut("DETECTE")
                .stationnementId(stationnement.getId())
                .quaiAttribue(quaiAttribue != null
                        ? quaiAttribue.getNumero() : null)
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
        wsNotifService.notifierAdmins("BUS_PARTI", Map.of(
                "matricule", stat.getMatricule(),
                "montant", montant,
                "stationnementId", stationnementId
        ));

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

    private OCRDetectionResponse traiterPlaquillisible() {
        StationnementOCR stat = new StationnementOCR();
        stat.setMatricule("ILLISIBLE");
        stat.setHeureEntree(LocalDateTime.now());
        stat.setStatut(StatutStationnement.CORRECTION_MANUELLE);
        stat.setCorrectionManuelle(true);
        stationnementRepo.save(stat);

        wsNotifService.notifierAdmins("PLAQUE_ILLISIBLE", Map.of(
                "message", "Plaque illisible — intervention manuelle requise",
                "stationnementId", stat.getId()
        ));

        return OCRDetectionResponse.builder()
                .matricule("ILLISIBLE")
                .statut("ILLISIBLE")
                .stationnementId(stat.getId())
                .message("Image illisible — correction manuelle requise")
                .succès(false)
                .build();
    }

    // Simulation OCR académique
    private String simulerExtractionOCR(MultipartFile image) {
        // Dans la vraie version : appel HTTP vers microservice Python
        // Pour la démo : on retourne un matricule fictif basé sur le nom du fichier
        String filename = image.getOriginalFilename();
        if (filename != null && filename.contains("_")) {
            return filename.split("_")[0].toUpperCase();
        }
        return "12345-A-1"; // matricule par défaut pour la démo
    }

    private double calculerMontant(StationnementOCR stat) {
        if (stat.getHeureEntree() == null || stat.getHeureSortie() == null) {
            return 0.0;
        }
        if (stat.getQuai() == null) return 0.0;

        long minutes = java.time.temporal.ChronoUnit.MINUTES.between(
                stat.getHeureEntree(), stat.getHeureSortie());
        double heures = minutes / 60.0;
        double montant = heures * stat.getQuai().getTarifHoraire();
        return Math.round(montant * 100.0) / 100.0;
    }
}