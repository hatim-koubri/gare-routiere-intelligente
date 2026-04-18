package ma.emsi.gare.controller;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.HoraireOfflineResponse;
import ma.emsi.gare.service.HoraireOfflineService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

@RestController
@RequestMapping("/api/offline")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HoraireOfflineController {

    private final HoraireOfflineService horaireOfflineService;
    private final ObjectMapper objectMapper;

    // ===== GET horaires 7 jours (affichage JSON) =====
    @GetMapping("/horaires")
    public ResponseEntity<HoraireOfflineResponse> getHoraires7Jours() {
        return ResponseEntity.ok(horaireOfflineService.genererHoraires7Jours());
    }

    // ===== GET horaires N jours personnalisable =====
    @GetMapping("/horaires/{jours}")
    public ResponseEntity<HoraireOfflineResponse> getHorairesParJours(
            @PathVariable int jours) {

        if (jours < 1 || jours > 30) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(horaireOfflineService.genererHoraires(jours));
    }

    // ===== DOWNLOAD — fichier JSON téléchargeable =====
    @GetMapping("/horaires/download")
    public ResponseEntity<byte[]> downloadHoraires(
            @RequestParam(defaultValue = "7") int jours) {
        try {
            HoraireOfflineResponse horaires = horaireOfflineService.genererHoraires(jours);

            // Sérialisation JSON formatée
            objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
            byte[] jsonBytes = objectMapper.writeValueAsBytes(horaires);

            String filename = "horaires_" + jours + "jours.json";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_JSON)
                    .contentLength(jsonBytes.length)
                    .body(jsonBytes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}