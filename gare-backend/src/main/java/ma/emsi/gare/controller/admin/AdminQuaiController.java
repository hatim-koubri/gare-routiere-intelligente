package ma.emsi.gare.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.QuaiRequest;
import ma.emsi.gare.dto.response.QuaiResponseDTO;
import ma.emsi.gare.entity.Quai;
import ma.emsi.gare.mapper.GareMapper;
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
    private final GareMapper mapper;

    @PostMapping
    public ResponseEntity<QuaiResponseDTO> creer(
            @Valid @RequestBody QuaiRequest request) {
        Quai quai = adminQuaiService.creerQuai(request);
        return ResponseEntity.ok(mapper.toQuaiDTO(quai));
    }

    @PostMapping("/{quaiId}/attribuer/{compagnieId}")
    public ResponseEntity<QuaiResponseDTO> attribuer(
            @PathVariable Long quaiId,
            @PathVariable Long compagnieId) {
        Quai quai = adminQuaiService
                .attribuerQuaiACompagnie(quaiId, compagnieId);
        return ResponseEntity.ok(mapper.toQuaiDTO(quai));
    }

    @PostMapping("/{quaiId}/liberer")
    public ResponseEntity<QuaiResponseDTO> liberer(
            @PathVariable Long quaiId) {
        Quai quai = adminQuaiService.libererQuai(quaiId);
        return ResponseEntity.ok(mapper.toQuaiDTO(quai));
    }

    @GetMapping
    public ResponseEntity<List<QuaiResponseDTO>> getAll() {
        List<Quai> quais = adminQuaiService.getTousLesQuais();
        return ResponseEntity.ok(mapper.toQuaiDTOList(quais));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<QuaiResponseDTO>> getDisponibles() {
        List<Quai> quais = adminQuaiService.getQuaisDisponibles();
        return ResponseEntity.ok(mapper.toQuaiDTOList(quais));
    }

    @GetMapping("/compagnie/{compagnieId}")
    public ResponseEntity<List<QuaiResponseDTO>> getByCompagnie(
            @PathVariable Long compagnieId) {
        List<Quai> quais =
                adminQuaiService.getQuaisParCompagnie(compagnieId);
        return ResponseEntity.ok(mapper.toQuaiDTOList(quais));
    }
}