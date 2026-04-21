package ma.emsi.gare.controller.admin;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.CompagnieResponseDTO;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.mapper.GareMapper;
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
    private final GareMapper mapper;

    @PostMapping
    public ResponseEntity<CompagnieResponseDTO> creer(
            @RequestBody Compagnie compagnie) {
        Compagnie saved = compagnieRepository.save(compagnie);
        return ResponseEntity.ok(mapper.toCompagnieDTO(saved));
    }

    @GetMapping
    public ResponseEntity<List<CompagnieResponseDTO>> getAll() {
        List<Compagnie> compagnies = compagnieRepository.findAll();
        return ResponseEntity.ok(mapper.toCompagnieDTOList(compagnies));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompagnieResponseDTO> getById(
            @PathVariable Long id) {
        Compagnie compagnie = compagnieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Compagnie non trouvée"));
        return ResponseEntity.ok(mapper.toCompagnieDTO(compagnie));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompagnieResponseDTO> modifier(
            @PathVariable Long id,
            @RequestBody Compagnie compagnie) {
        compagnie.setId(id);
        Compagnie saved = compagnieRepository.save(compagnie);
        return ResponseEntity.ok(mapper.toCompagnieDTO(saved));
    }

    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<CompagnieResponseDTO> desactiver(
            @PathVariable Long id) {
        Compagnie compagnie = compagnieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Compagnie non trouvée"));
        compagnie.setActif(false);
        return ResponseEntity.ok(
                mapper.toCompagnieDTO(compagnieRepository.save(compagnie)));
    }
}