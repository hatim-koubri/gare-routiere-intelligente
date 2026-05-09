package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ChauffeurCreateRequest;
import ma.emsi.gare.dto.request.ChauffeurUpdateRequest;
import ma.emsi.gare.dto.response.ChauffeurResponseDTO;
import ma.emsi.gare.entity.Chauffeur;
import ma.emsi.gare.service.ResponsableChauffeurService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/chauffeurs")
@RequiredArgsConstructor
public class ResponsableChauffeurController {

    private final ResponsableChauffeurService responsableChauffeurService;

    @PostMapping
    public ResponseEntity<ChauffeurResponseDTO> creer(
            @Valid @RequestBody ChauffeurCreateRequest request,
            Authentication authentication
    ) {

        Chauffeur chauffeur =
                responsableChauffeurService.creer(
                        request,
                        authentication
                );

        return ResponseEntity.ok(toDto(chauffeur));
    }

    @GetMapping
    public ResponseEntity<List<ChauffeurResponseDTO>> getMesChauffeurs(
            Authentication authentication
    ) {

        List<ChauffeurResponseDTO> chauffeurs =
                responsableChauffeurService
                        .getMesChauffeurs(authentication)
                        .stream()
                        .map(this::toDto)
                        .toList();

        return ResponseEntity.ok(chauffeurs);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChauffeurResponseDTO> modifier(
            @PathVariable Long id,
            @Valid @RequestBody ChauffeurUpdateRequest request,
            Authentication authentication
    ) {
        Chauffeur chauffeur =
                responsableChauffeurService.modifier(id, request, authentication);
        return ResponseEntity.ok(toDto(chauffeur));
    }

    @PatchMapping("/{id}/conge")
    public ResponseEntity<ChauffeurResponseDTO> toggleConge(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Chauffeur chauffeur =
                responsableChauffeurService.toggleConge(id, authentication);
        return ResponseEntity.ok(toDto(chauffeur));
    }

    @PatchMapping("/{id}/activer")
    public ResponseEntity<ChauffeurResponseDTO> activer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Chauffeur chauffeur =
                responsableChauffeurService.activer(id, authentication);
        return ResponseEntity.ok(toDto(chauffeur));
    }

    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<ChauffeurResponseDTO> desactiver(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Chauffeur chauffeur =
                responsableChauffeurService.desactiver(id, authentication);
        return ResponseEntity.ok(toDto(chauffeur));
    }

    private ChauffeurResponseDTO toDto(Chauffeur chauffeur) {

        ChauffeurResponseDTO dto = new ChauffeurResponseDTO();

        dto.setId(chauffeur.getId());

        dto.setNom(chauffeur.getNom());
        dto.setPrenom(chauffeur.getPrenom());
        dto.setEmail(chauffeur.getEmail());
        dto.setTelephone(chauffeur.getTelephone());

        dto.setNumeroPermis(chauffeur.getNumeroPermis());
        dto.setDateEmbauche(chauffeur.getDateEmbauche());

        dto.setNoteMoyenne(chauffeur.getNoteMoyenne());

        dto.setEnConge(chauffeur.isEnConge());
        dto.setActif(chauffeur.isActif());

        if (chauffeur.getCompagnie() != null) {

            dto.setCompagnieId(
                    chauffeur.getCompagnie().getId()
            );

            dto.setCompagnieNom(
                    chauffeur.getCompagnie().getNom()
            );
        }

        return dto;
    }
}