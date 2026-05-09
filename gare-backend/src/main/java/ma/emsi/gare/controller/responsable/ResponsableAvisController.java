package ma.emsi.gare.controller.responsable;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.response.AvisResponseDTO;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.service.AvisService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/responsable/avis")
@RequiredArgsConstructor
public class ResponsableAvisController {

    private final AvisService avisService;

    @GetMapping
    public ResponseEntity<List<AvisResponseDTO>> getAvis(
            @RequestParam(required = false) Long trajetId,
            Authentication authentication
    ) {
        ResponsableCompagnie responsable = (ResponsableCompagnie) authentication.getPrincipal();
        Long compagnieId = responsable.getCompagnie().getId();

        if (trajetId != null) {
            return ResponseEntity.ok(avisService.getAvisByTrajet(trajetId)
                    .stream()
                    .filter(a -> a.getCompagnieId().equals(compagnieId))
                    .toList());
        }
        return ResponseEntity.ok(avisService.getAvisByCompagnie(compagnieId));
    }
}
