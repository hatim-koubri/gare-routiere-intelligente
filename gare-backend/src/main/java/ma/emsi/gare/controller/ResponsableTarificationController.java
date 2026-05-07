package ma.emsi.gare.controller.responsable;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.TarificationDynamiqueRequest;
import ma.emsi.gare.dto.response.TarificationDynamiqueResponseDTO;
import ma.emsi.gare.entity.TarificationDynamique;
import ma.emsi.gare.service.ResponsableTarificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/responsable/tarification")
@RequiredArgsConstructor
public class ResponsableTarificationController {

    private final ResponsableTarificationService service;

    @PostMapping
    public ResponseEntity<TarificationDynamiqueResponseDTO>
    configurer(
            @RequestBody TarificationDynamiqueRequest request,
            Authentication authentication
    ) {

        TarificationDynamique config =
                service.configurer(request, authentication);

        return ResponseEntity.ok(toDto(config));
    }

    @GetMapping
    public ResponseEntity<TarificationDynamiqueResponseDTO>
    getConfig(Authentication authentication) {

        return ResponseEntity.ok(
                toDto(service.getConfiguration(authentication))
        );
    }

    private TarificationDynamiqueResponseDTO toDto(
            TarificationDynamique config
    ) {

        TarificationDynamiqueResponseDTO dto =
                new TarificationDynamiqueResponseDTO();

        dto.setId(config.getId());

        dto.setReductionTrenteJours(
                config.getReductionTrenteJours()
        );

        dto.setReductionQuinzeJours(
                config.getReductionQuinzeJours()
        );

        dto.setSupplementJourMeme(
                config.getSupplementJourMeme()
        );

        dto.setSeuilHaut(config.getSeuilHaut());

        dto.setSupplementHaut(
                config.getSupplementHaut()
        );

        dto.setSeuilBas(config.getSeuilBas());

        dto.setReductionBas(
                config.getReductionBas()
        );

        if (config.getCompagnie() != null) {

            dto.setCompagnieId(
                    config.getCompagnie().getId()
            );

            dto.setCompagnieNom(
                    config.getCompagnie().getNom()
            );
        }

        return dto;
    }
}