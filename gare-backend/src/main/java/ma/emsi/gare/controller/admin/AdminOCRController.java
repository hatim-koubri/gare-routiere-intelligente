package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import ma.emsi.gare.dto.request.OCRCorrectionRequest;
import ma.emsi.gare.dto.response.OCRDetectionResponse;
import ma.emsi.gare.dto.response.StationnementOCRResponseDTO;

import ma.emsi.gare.entity.StationnementOCR;

import ma.emsi.gare.mapper.GareMapper;

import ma.emsi.gare.repository.StationnementOCRRepository;

import ma.emsi.gare.service.OCRService;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ocr")
@RequiredArgsConstructor
public class AdminOCRController {

    private final OCRService ocrService;

    private final StationnementOCRRepository stationnementRepo;

    private final GareMapper mapper;

    // ==========================================
    // UPLOAD IMAGE OCR
    // ==========================================

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImage(
            @RequestParam("image") MultipartFile image) {

        try {

            // VERIFICATION TYPE IMAGE UNIQUEMENT
            String contentType = image.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                System.out.println("REJET : Type de fichier non autorisé : " + contentType);
                return ResponseEntity
                        .badRequest()
                        .body("Seules les images sont acceptées (reçu: " + contentType + ")");
            }

            // DEBUG DETAILS
            System.out.println("IMAGE : " + image.getOriginalFilename() + " (" + image.getSize() + " bytes)");

            // SAUVEGARDE PHYSIQUE DE L'IMAGE
            String uploadDir = "uploads/ocr";
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }

            String fileName = java.util.UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            java.nio.file.Files.copy(image.getInputStream(), filePath);
            
            String imageUrl = "/uploads/ocr/" + fileName;
            System.out.println("Image sauvegardée : " + imageUrl);

            // VERIFICATION
            if (image.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body("Image vide");
            }

            // TRAITEMENT OCR (Passer l'URL pour stockage en BDD)
            OCRDetectionResponse response = ocrService.traiterImageOCR(image, imageUrl);
            // On peut enrichir la réponse avec l'URL de l'image
            response.setMessage(response.getMessage() + " | Image sauvegardée sous: " + imageUrl);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity
                    .status(500)
                    .body(
                            "Erreur OCR : "
                                    + e.getMessage());
        }
    }

    // ==========================================
    // TEST MATRICULE
    // ==========================================

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/matricule/{matricule}")
    public ResponseEntity<OCRDetectionResponse> traiterMatricule(
            @PathVariable String matricule) {

        try {

            OCRDetectionResponse response = ocrService.traiterMatriculeExtrait(
                    matricule,
                    null);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            throw e;
        }
    }

    // ==========================================
    // CORRECTION MANUELLE
    // ==========================================

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/corriger/{stationnementId}")
    public ResponseEntity<OCRDetectionResponse> corrigerOCR(
            @PathVariable Long stationnementId,

            @Valid @RequestBody OCRCorrectionRequest request) {

        try {

            OCRDetectionResponse response = ocrService.corrigerOCR(
                    stationnementId,
                    request);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            throw e;
        }
    }

    // ==========================================
    // LISTE STATIONNEMENTS
    // ==========================================

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stationnements")
    public ResponseEntity<List<StationnementOCRResponseDTO>> getStationnements() {

        try {

            List<StationnementOCR> stationnements = stationnementRepo.findAll();

            return ResponseEntity.ok(
                    mapper.toStationnementDTOList(
                            stationnements));

        } catch (Exception e) {

            e.printStackTrace();

            throw e;
        }
    }

    // ==========================================
    // CORRECTIONS EN ATTENTE
    // ==========================================

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/corrections-en-attente")
    public ResponseEntity<List<StationnementOCRResponseDTO>> getCorrectionsEnAttente() {

        try {

            List<StationnementOCR> stationnements = stationnementRepo
                    .findByCorrectionManuelleTrue();

            return ResponseEntity.ok(
                    mapper.toStationnementDTOList(
                            stationnements));

        } catch (Exception e) {

            e.printStackTrace();

            throw e;
        }
    }

    // ==========================================
    // TERMINER STATIONNEMENT
    // ==========================================

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/terminer/{stationnementId}")
    public ResponseEntity<StationnementOCRResponseDTO> terminer(
            @PathVariable Long stationnementId) {

        try {

            StationnementOCR stationnement = ocrService
                    .terminerStationnement(
                            stationnementId);

            return ResponseEntity.ok(
                    mapper.toStationnementDTO(
                            stationnement));

        } catch (Exception e) {

            e.printStackTrace();

            throw e;
        }
    }
}