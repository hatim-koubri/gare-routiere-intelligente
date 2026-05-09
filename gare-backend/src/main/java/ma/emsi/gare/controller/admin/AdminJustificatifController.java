package ma.emsi.gare.controller.admin;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.repository.VoyageurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/justificatifs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminJustificatifController {

    private final VoyageurRepository voyageurRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<Voyageur> voyageurs = voyageurRepository.findAllWithJustificatif();
        List<Map<String, Object>> result = voyageurs.stream()
                .map(v -> Map.<String, Object>of(
                        "id", v.getId(),
                        "nom", v.getNom(),
                        "prenom", v.getPrenom(),
                        "email", v.getEmail(),
                        "categorieTarifaire", v.getCategorieTarifaire().name(),
                        "justificatifUrl", v.getJustificatifUrl(),
                        "valide", v.isJustificatifValide()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/en-attente")
    public ResponseEntity<List<Map<String, Object>>> getEnAttente() {
        List<Voyageur> voyageurs = voyageurRepository.findWithJustificatifEnAttente();
        List<Map<String, Object>> result = voyageurs.stream()
                .map(v -> Map.<String, Object>of(
                        "id", v.getId(),
                        "nom", v.getNom(),
                        "prenom", v.getPrenom(),
                        "email", v.getEmail(),
                        "categorieTarifaire", v.getCategorieTarifaire().name(),
                        "justificatifUrl", v.getJustificatifUrl(),
                        "valide", false
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{voyageurId}/approuver")
    public ResponseEntity<Map<String, Object>> approuver(
            @PathVariable Long voyageurId) {
        Voyageur voyageur = voyageurRepository.findById(voyageurId)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
        voyageur.setJustificatifValide(true);
        voyageurRepository.save(voyageur);
        return ResponseEntity.ok(Map.of(
                "message", "Justificatif approuvé avec succès",
                "voyageurId", voyageurId
        ));
    }

    @PostMapping("/{voyageurId}/rejeter")
    public ResponseEntity<Map<String, Object>> rejeter(
            @PathVariable Long voyageurId) {
        Voyageur voyageur = voyageurRepository.findById(voyageurId)
                .orElseThrow(() -> new RuntimeException("Voyageur non trouvé"));
        voyageur.setJustificatifUrl(null);
        voyageur.setJustificatifValide(false);
        voyageurRepository.save(voyageur);
        return ResponseEntity.ok(Map.of(
                "message", "Justificatif rejeté et supprimé",
                "voyageurId", voyageurId
        ));
    }
}
