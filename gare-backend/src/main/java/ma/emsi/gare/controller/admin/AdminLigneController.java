package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.LigneRequest;
import ma.emsi.gare.entity.Arret;
import ma.emsi.gare.entity.Ligne;
import ma.emsi.gare.service.AdminLigneService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/lignes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminLigneController {

    private final AdminLigneService adminLigneService;

    @PostMapping
    public ResponseEntity<Ligne> creer(@Valid @RequestBody LigneRequest request) {
        return ResponseEntity.ok(adminLigneService.creerLigne(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ligne> modifier(@PathVariable Long id,
                                          @Valid @RequestBody LigneRequest request) {
        return ResponseEntity.ok(adminLigneService.modifierLigne(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        adminLigneService.supprimerLigne(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<Ligne>> getAll() {
        return ResponseEntity.ok(adminLigneService.getToutesLesLignes());
    }

    @GetMapping("/{id}/arrets")
    public ResponseEntity<List<Arret>> getArrets(@PathVariable Long id) {
        return ResponseEntity.ok(adminLigneService.getArretsParLigne(id));
    }
}