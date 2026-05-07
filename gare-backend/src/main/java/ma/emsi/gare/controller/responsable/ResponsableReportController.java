package ma.emsi.gare.controller.responsable;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.service.ResponsableReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/responsable/reports")
@RequiredArgsConstructor
public class ResponsableReportController {

    private final ResponsableReportService responsableReportService;

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            Authentication authentication
    ) throws Exception {

        byte[] pdf =
                responsableReportService.exportPdf(authentication);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=rapport.pdf"
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel(
            Authentication authentication
    ) throws Exception {

        byte[] excel =
                responsableReportService.exportExcel(authentication);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=rapport.xlsx"
                )
                .contentType(
                        MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        )
                )
                .body(excel);
    }
}