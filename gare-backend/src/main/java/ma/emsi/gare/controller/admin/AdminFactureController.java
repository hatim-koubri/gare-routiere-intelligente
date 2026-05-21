package ma.emsi.gare.controller.admin;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.StationnementOCR;
import ma.emsi.gare.repository.StationnementOCRRepository;
import ma.emsi.gare.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/factures")
@RequiredArgsConstructor
public class AdminFactureController {

    private final StationnementOCRRepository stationnementRepo;
    private final PdfService pdfService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stationnement/{stationnementId}")
    public ResponseEntity<byte[]> telechargerFactureStationnement(
            @PathVariable Long stationnementId) {

        StationnementOCR stat = stationnementRepo.findById(stationnementId)
                .orElseThrow(() -> new RuntimeException("Stationnement non trouvé: " + stationnementId));

        byte[] pdf = pdfService.genererFactureStationnementRIHLA(stat);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", "facture-stationnement-" + stationnementId + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}
