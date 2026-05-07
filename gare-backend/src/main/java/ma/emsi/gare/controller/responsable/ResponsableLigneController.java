package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.LigneRequest;
import ma.emsi.gare.dto.response.LigneResponseDTO;
import ma.emsi.gare.entity.Ligne;
import ma.emsi.gare.mapper.GareMapper;
import ma.emsi.gare.service.ResponsableLigneService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/lignes")
@RequiredArgsConstructor
public class ResponsableLigneController {

    private final ResponsableLigneService responsableLigneService;
    private final GareMapper mapper;

    @PostMapping
    public ResponseEntity<LigneResponseDTO> creer(
            @Valid @RequestBody LigneRequest request,
            Authentication authentication
    ) {

        Ligne ligne = responsableLigneService
                .creerLigne(request, authentication);

        return ResponseEntity.ok(mapper.toLigneDTO(ligne));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LigneResponseDTO> modifier(
            @PathVariable Long id,
            @Valid @RequestBody LigneRequest request,
            Authentication authentication
    ) {

        Ligne ligne = responsableLigneService
                .modifierLigne(id, request, authentication);

        return ResponseEntity.ok(mapper.toLigneDTO(ligne));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(
            @PathVariable Long id,
            Authentication authentication
    ) {

        responsableLigneService.supprimerLigne(id, authentication);

        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<LigneResponseDTO>> getMesLignes(
            Authentication authentication
    ) {

        List<Ligne> lignes =
                responsableLigneService.getMesLignes(authentication);

        return ResponseEntity.ok(mapper.toLigneDTOList(lignes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LigneResponseDTO> getById(
            @PathVariable Long id,
            Authentication authentication
    ) {

        Ligne ligne =
                responsableLigneService.getById(id, authentication);

        return ResponseEntity.ok(mapper.toLigneDTO(ligne));
    }
}