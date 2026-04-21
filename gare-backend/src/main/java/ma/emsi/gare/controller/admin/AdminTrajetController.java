package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.RegisterRequest;
import ma.emsi.gare.dto.request.TrajetRequest;
import ma.emsi.gare.entity.Chauffeur;
import ma.emsi.gare.entity.Trajet;
import ma.emsi.gare.service.AdminTrajetChauffeurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTrajetController {

    private final AdminTrajetChauffeurService service;

    // ===== Trajets =====
    @PostMapping("/trajets")
    public ResponseEntity<Trajet> creerTrajet(
            @Valid @RequestBody TrajetRequest request) {
        return ResponseEntity.ok(service.creerTrajet(request));
    }

    @PutMapping("/trajets/{id}")
    public ResponseEntity<Trajet> modifierTrajet(
            @PathVariable Long id,
            @Valid @RequestBody TrajetRequest request) {
        return ResponseEntity.ok(service.modifierTrajet(id, request));
    }

    @PatchMapping("/trajets/{id}/annuler")
    public ResponseEntity<Trajet> annulerTrajet(@PathVariable Long id) {
        return ResponseEntity.ok(service.annulerTrajet(id));
    }

    @GetMapping("/trajets")
    public ResponseEntity<List<Trajet>> getTrajets() {
        return ResponseEntity.ok(service.getTousLesTrajets());
    }

    // ===== Chauffeurs =====
    @PostMapping("/chauffeurs/compagnie/{compagnieId}")
    public ResponseEntity<Chauffeur> creerChauffeur(
            @Valid @RequestBody RegisterRequest request,
            @PathVariable Long compagnieId) {
        return ResponseEntity.ok(service.creerChauffeur(request, compagnieId));
    }

    @PatchMapping("/chauffeurs/{id}/conge")
    public ResponseEntity<Chauffeur> mettreEnConge(@PathVariable Long id) {
        return ResponseEntity.ok(service.mettreEnConge(id));
    }

    @PatchMapping("/chauffeurs/{id}/retour-conge")
    public ResponseEntity<Chauffeur> remettreDuConge(@PathVariable Long id) {
        return ResponseEntity.ok(service.remettreDuConge(id));
    }
}