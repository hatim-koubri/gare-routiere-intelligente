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
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ocr")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminOCRController {

    private final OCRService ocrService;
    private final StationnementOCRRepository stationnementRepo;
    private final GareMapper mapper;  // ← Injecter le mapper

    // T3-27 — Upload image (simulation caméra)
    @PostMapping("/upload")
    public ResponseEntity<OCRDetectionResponse> uploadImage(
            @RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(ocrService.traiterImageOCR(image));
    }

    // T3-04 — Traiter matricule directement (test)
    @PostMapping("/matricule/{matricule}")
    public ResponseEntity<OCRDetectionResponse> traiterMatricule(
            @PathVariable String matricule) {
        return ResponseEntity.ok(
                ocrService.traiterMatriculeExtrait(matricule, null));
    }

    // T3-09 — Correction manuelle
    @PutMapping("/corriger/{stationnementId}")
    public ResponseEntity<OCRDetectionResponse> corrigerOCR(
            @PathVariable Long stationnementId,
            @Valid @RequestBody OCRCorrectionRequest request) {
        return ResponseEntity.ok(
                ocrService.corrigerOCR(stationnementId, request));
    }

    // Dashboard OCR — liste des stationnements (AVEC DTO)
    @GetMapping("/stationnements")
    public ResponseEntity<List<StationnementOCRResponseDTO>> getStationnements() {
        List<StationnementOCR> stationnements = stationnementRepo.findAll();
        return ResponseEntity.ok(mapper.toStationnementDTOList(stationnements));
    }

    // Liste corrections manuelles en attente (AVEC DTO)
    @GetMapping("/corrections-en-attente")
    public ResponseEntity<List<StationnementOCRResponseDTO>> getCorrectionsEnAttente() {
        List<StationnementOCR> stationnements = stationnementRepo.findByCorrectionManuelleTrue();
        return ResponseEntity.ok(mapper.toStationnementDTOList(stationnements));
    }

    // Terminer stationnement (bus parti)
    @PostMapping("/terminer/{stationnementId}")
    public ResponseEntity<StationnementOCRResponseDTO> terminer(
            @PathVariable Long stationnementId) {
        StationnementOCR stationnement = ocrService.terminerStationnement(stationnementId);
        return ResponseEntity.ok(mapper.toStationnementDTO(stationnement));
    }
}