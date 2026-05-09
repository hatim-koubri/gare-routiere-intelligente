package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.JustificatifUploadResponse;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.repository.VoyageurRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/voyageur/justificatif")
@RequiredArgsConstructor
public class VoyageurJustificatifController {

    private final VoyageurRepository voyageurRepository;

    @Value("${app.upload.dir:uploads/justificatifs}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadJustificatif(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        String mimeType = file.getContentType();
        if (mimeType == null || (!mimeType.equals("image/jpeg") && !mimeType.equals("image/png") && !mimeType.equals("application/pdf"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Format accepté: JPG, PNG, PDF"));
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier trop volumineux (max 5MB)"));
        }

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            Voyageur voyageur = voyageurRepository.findById(user.getId())
                    .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
            voyageur.setJustificatifUrl("/uploads/justificatifs/" + filename);
            voyageur.setJustificatifValide(false);
            voyageurRepository.save(voyageur);

            return ResponseEntity.ok(JustificatifUploadResponse.builder()
                    .url("/uploads/justificatifs/" + filename)
                    .message("Justificatif uploadé avec succès. En attente de validation.")
                    .build());
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de l'upload"));
        }
    }

    @GetMapping("/statut")
    public ResponseEntity<?> getStatutJustificatif(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) return ResponseEntity.status(403).build();

        Voyageur voyageur = voyageurRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
        return ResponseEntity.ok(Map.of(
                "url", voyageur.getJustificatifUrl() != null ? voyageur.getJustificatifUrl() : "",
                "valide", voyageur.isJustificatifValide(),
                "uploaded", voyageur.getJustificatifUrl() != null
        ));
    }
}
