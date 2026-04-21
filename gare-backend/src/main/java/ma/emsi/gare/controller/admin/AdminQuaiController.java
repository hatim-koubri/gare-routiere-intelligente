package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.QuaiRequest;
import ma.emsi.gare.entity.Quai;
import ma.emsi.gare.service.AdminQuaiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/quais")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuaiController {

    private final AdminQuaiService adminQuaiService;

    @PostMapping
    public ResponseEntity<Quai> creer(@Valid @RequestBody QuaiRequest request) {
        return ResponseEntity.ok(adminQuaiService.creerQuai(request));
    }

    @PostMapping("/{quaiId}/attribuer/{compagnieId}")
    public ResponseEntity<Quai> attribuer(@PathVariable Long quaiId,
                                          @PathVariable Long compagnieId) {
        return ResponseEntity.ok(
                adminQuaiService.attribuerQuaiACompagnie(quaiId, compagnieId));
    }

    @PostMapping("/{quaiId}/liberer")
    public ResponseEntity<Quai> liberer(@PathVariable Long quaiId) {
        return ResponseEntity.ok(adminQuaiService.libererQuai(quaiId));
    }

    @GetMapping
    public ResponseEntity<List<Quai>> getAll() {
        return ResponseEntity.ok(adminQuaiService.getTousLesQuais());
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<Quai>> getDisponibles() {
        return ResponseEntity.ok(adminQuaiService.getQuaisDisponibles());
    }
}