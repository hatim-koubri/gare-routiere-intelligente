package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.CreerReclamationRequest;
import ma.emsi.gare.dto.response.ReclamationResponseDTO;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.repository.VoyageurRepository;
import ma.emsi.gare.service.VoyageurReclamationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voyageur/reclamations")
@RequiredArgsConstructor
public class VoyageurReclamationController {

    private final VoyageurReclamationService reclamationService;
    private final VoyageurRepository voyageurRepository;

    private Voyageur getVoyageur(Authentication auth) {
        return voyageurRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
    }

    @PostMapping
    public ResponseEntity<ReclamationResponseDTO> creer(
            @RequestBody CreerReclamationRequest request,
            Authentication authentication
    ) {
        Voyageur voyageur = getVoyageur(authentication);
        return ResponseEntity.ok(reclamationService.creer(voyageur.getId(), request));
    }

    @GetMapping
    public ResponseEntity<List<ReclamationResponseDTO>> mesReclamations(
            Authentication authentication
    ) {
        Voyageur voyageur = getVoyageur(authentication);
        return ResponseEntity.ok(reclamationService.mesReclamations(voyageur.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReclamationResponseDTO> getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Voyageur voyageur = getVoyageur(authentication);
        return ResponseEntity.ok(reclamationService.getById(id, voyageur.getId()));
    }
}
