package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.CodePromoRequest;
import ma.emsi.gare.dto.response.CodePromoResponseDTO;
import ma.emsi.gare.entity.CodePromo;
import ma.emsi.gare.service.ResponsableCodePromoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/codes-promo")
@RequiredArgsConstructor
public class ResponsableCodePromoController {

    private final ResponsableCodePromoService responsableCodePromoService;

    @PostMapping
    public ResponseEntity<CodePromoResponseDTO> creer(
            @Valid @RequestBody CodePromoRequest request,
            Authentication authentication
    ) {

        CodePromo promo = responsableCodePromoService
                .creer(request, authentication);

        return ResponseEntity.ok(toDto(promo));
    }

    @PatchMapping("/{id}/activer")
    public ResponseEntity<CodePromoResponseDTO> activer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        CodePromo promo = responsableCodePromoService
                .activer(id, authentication);
        return ResponseEntity.ok(toDto(promo));
    }

    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<CodePromoResponseDTO> desactiver(
            @PathVariable Long id,
            Authentication authentication
    ) {

        CodePromo promo = responsableCodePromoService
                .desactiver(id, authentication);

        return ResponseEntity.ok(toDto(promo));
    }

    @GetMapping
    public ResponseEntity<List<CodePromoResponseDTO>> getMesCodes(
            Authentication authentication
    ) {

        List<CodePromoResponseDTO> promos =
                responsableCodePromoService
                        .getMesCodes(authentication)
                        .stream()
                        .map(this::toDto)
                        .toList();

        return ResponseEntity.ok(promos);
    }

    private CodePromoResponseDTO toDto(CodePromo promo) {

        CodePromoResponseDTO dto =
                new CodePromoResponseDTO();

        dto.setId(promo.getId());

        dto.setCode(promo.getCode());

        dto.setPourcentageReduction(
                promo.getPourcentageReduction()
        );

        dto.setDateExpiration(
                promo.getDateExpiration()
        );

        dto.setNbUtilisationsMax(
                promo.getNbUtilisationsMax()
        );

        dto.setNbUtilisationsActuel(
                promo.getNbUtilisationsActuel()
        );

        dto.setActif(promo.isActif());

        if (promo.getCompagnie() != null) {

            dto.setCompagnieId(
                    promo.getCompagnie().getId()
            );

            dto.setCompagnieNom(
                    promo.getCompagnie().getNom()
            );
        }

        return dto;
    }
}