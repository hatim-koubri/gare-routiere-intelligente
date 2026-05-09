package ma.emsi.gare.controller;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.service.HoraireExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/offline/horaires")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HoraireExportController {

    private final HoraireExportService exportService;

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPDF(@RequestParam(defaultValue = "7") int jours) {
        try {
            byte[] pdf = exportService.exporterPDF(jours);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"horaires_" + jours + "jours.pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(pdf.length)
                    .body(pdf);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(@RequestParam(defaultValue = "7") int jours) {
        try {
            byte[] excel = exportService.exporterExcel(jours);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"horaires_" + jours + "jours.xlsx\"")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .contentLength(excel.length)
                    .body(excel);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
