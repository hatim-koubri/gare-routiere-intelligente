package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.LigneRequest;
import ma.emsi.gare.dto.response.LigneResponseDTO;
import ma.emsi.gare.entity.Ligne;
import ma.emsi.gare.mapper.GareMapper;
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
    private final GareMapper mapper;

    @PostMapping
    public ResponseEntity<LigneResponseDTO> creer(
            @Valid @RequestBody LigneRequest request) {
        Ligne ligne = adminLigneService.creerLigne(request);
        return ResponseEntity.ok(mapper.toLigneDTO(ligne));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LigneResponseDTO> modifier(
            @PathVariable Long id,
            @Valid @RequestBody LigneRequest request) {
        Ligne ligne = adminLigneService.modifierLigne(id, request);
        return ResponseEntity.ok(mapper.toLigneDTO(ligne));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        adminLigneService.supprimerLigne(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<LigneResponseDTO>> getAll() {
        List<Ligne> lignes = adminLigneService.getToutesLesLignes();
        return ResponseEntity.ok(mapper.toLigneDTOList(lignes));
    }

    @GetMapping("/compagnie/{compagnieId}")
    public ResponseEntity<List<LigneResponseDTO>> getByCompagnie(
            @PathVariable Long compagnieId) {
        List<Ligne> lignes =
                adminLigneService.getLignesParCompagnie(compagnieId);
        return ResponseEntity.ok(mapper.toLigneDTOList(lignes));
    }
}