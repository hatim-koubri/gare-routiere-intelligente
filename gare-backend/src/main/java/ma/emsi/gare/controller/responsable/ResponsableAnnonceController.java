package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.AnnonceRequest;
import ma.emsi.gare.dto.response.AnnonceResponseDTO;
import ma.emsi.gare.entity.Annonce;
import ma.emsi.gare.service.ResponsableAnnonceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/annonces")
@RequiredArgsConstructor
public class ResponsableAnnonceController {

    private final ResponsableAnnonceService service;

    @PostMapping
    public ResponseEntity<AnnonceResponseDTO>
    creer(
            @Valid @RequestBody AnnonceRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                toDto(service.creer(request, authentication))
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<AnnonceResponseDTO>
    modifier(
            @PathVariable Long id,
            @Valid @RequestBody AnnonceRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                toDto(service.modifier(
                        id,
                        request,
                        authentication
                ))
        );
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<AnnonceResponseDTO>
    toggle(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                toDto(service.toggleEtat(id, authentication))
        );
    }

    @PatchMapping("/{id}/etat")
    public ResponseEntity<AnnonceResponseDTO>
    changerEtat(
            @PathVariable Long id,
            @RequestParam boolean active,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                toDto(service.changerEtat(
                        id,
                        active,
                        authentication
                ))
        );
    }

    @GetMapping
    public ResponseEntity<List<AnnonceResponseDTO>>
    getMesAnnonces(Authentication authentication) {

        List<AnnonceResponseDTO> annonces =
                service.getMesAnnonces(authentication)
                        .stream()
                        .map(this::toDto)
                        .toList();

        return ResponseEntity.ok(annonces);
    }

    private AnnonceResponseDTO toDto(
            Annonce annonce
    ) {

        AnnonceResponseDTO dto =
                new AnnonceResponseDTO();

        dto.setId(annonce.getId());

        dto.setTitreFr(annonce.getTitreFr());

        dto.setTitreAr(annonce.getTitreAr());

        dto.setContenuFr(annonce.getContenuFr());

        dto.setContenuAr(annonce.getContenuAr());

        dto.setDateDebut(annonce.getDateDebut());

        dto.setDateFin(annonce.getDateFin());

        dto.setActive(annonce.isActive());

        if (annonce.getCompagnie() != null) {

            dto.setCompagnieId(
                    annonce.getCompagnie().getId()
            );

            dto.setCompagnieNom(
                    annonce.getCompagnie().getNom()
            );
        }

        return dto;
    }
}