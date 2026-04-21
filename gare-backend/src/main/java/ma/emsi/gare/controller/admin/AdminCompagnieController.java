package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.repository.CompagnieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/compagnies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCompagnieController {

    private final CompagnieRepository compagnieRepository;

    @PostMapping
    public ResponseEntity<Compagnie> creer(
            @RequestBody Compagnie compagnie) {
        return ResponseEntity.ok(compagnieRepository.save(compagnie));
    }

    @GetMapping
    public ResponseEntity<List<Compagnie>> getAll() {
        return ResponseEntity.ok(compagnieRepository.findAll());
    }
}