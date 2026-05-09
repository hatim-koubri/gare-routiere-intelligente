package ma.emsi.gare.controller.voyageur;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.AvisResponseDTO;
import ma.emsi.gare.entity.User;
import ma.emsi.gare.enums.Role;
import ma.emsi.gare.service.AvisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/voyageur/avis")
@RequiredArgsConstructor
public class VoyageurAvisController {

    private final AvisService avisService;

    @PostMapping
    public ResponseEntity<AvisResponseDTO> ajouterAvis(
            @Valid @RequestBody AjouterAvisRequest request,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        if (user.getRole() != Role.VOYAGEUR) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(avisService.ajouterAvis(
                user.getId(), request.getTrajetId(),
                request.getNotePonctualite(), request.getNoteConfort(),
                request.getNoteChauffeur(), request.getCommentaire()));
    }

    @GetMapping("/mes-avis")
    public ResponseEntity<List<AvisResponseDTO>> getMesAvis(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(avisService.getMesAvis(user.getId()));
    }

    @GetMapping("/eligibles")
    public ResponseEntity<List<Map<String, Object>>> getTrajetsEligibles(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(avisService.getTrajetsEligibles(user.getId()));
    }

    @GetMapping("/compagnie/{compagnieId}")
    public ResponseEntity<List<AvisResponseDTO>> getAvisByCompagnie(
            @PathVariable Long compagnieId) {
        return ResponseEntity.ok(avisService.getAvisByCompagnie(compagnieId));
    }

    @GetMapping("/trajet/{trajetId}")
    public ResponseEntity<List<AvisResponseDTO>> getAvisByTrajet(
            @PathVariable Long trajetId) {
        return ResponseEntity.ok(avisService.getAvisByTrajet(trajetId));
    }

    @Data
    public static class AjouterAvisRequest {
        @NotNull private Long trajetId;
        @NotNull @Min(1) @Max(5) private Integer notePonctualite;
        @NotNull @Min(1) @Max(5) private Integer noteConfort;
        @NotNull @Min(1) @Max(5) private Integer noteChauffeur;
        @NotBlank private String commentaire;
    }
}
