package ma.emsi.gare.controller.responsable;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.TraitementRemboursementRequest;
import ma.emsi.gare.dto.response.RemboursementResponseDTO;
import ma.emsi.gare.service.ResponsableRemboursementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/remboursements")
@RequiredArgsConstructor
public class ResponsableRemboursementController {

    private final ResponsableRemboursementService service;

    @GetMapping
    public ResponseEntity<List<RemboursementResponseDTO>>
    getDemandes(Authentication authentication) {

        return ResponseEntity.ok(
                service.getDemandes(authentication)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<RemboursementResponseDTO>
    getRemboursement(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                service.getById(id, authentication)
        );
    }

    @PatchMapping("/{id}/accepter")
    public ResponseEntity<RemboursementResponseDTO>
    accepter(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                service.accepter(id, authentication)
        );
    }

    @PatchMapping("/{id}/refuser")
    public ResponseEntity<RemboursementResponseDTO>
    refuser(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                service.refuser(id, authentication)
        );
    }

    @PatchMapping("/{id}/traiter")
    public ResponseEntity<RemboursementResponseDTO>
    traiter(
            @PathVariable Long id,
            @Valid
            @RequestBody TraitementRemboursementRequest request,
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                service.traiter(
                        id,
                        request,
                        authentication
                )
        );
    }
}