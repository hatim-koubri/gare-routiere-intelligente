package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.PaiementRequest;
import ma.emsi.gare.dto.response.PaiementResponseDTO;
import ma.emsi.gare.service.PaiementService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/voyageur/paiements")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VOYAGEUR')")
public class VoyageurPaiementController {

    private final PaiementService paiementService;

    @PostMapping("/simuler")
    public PaiementResponseDTO simulerPaiement(
            @RequestBody PaiementRequest request
    ) {
        return paiementService.simulerPaiement(request);
    }
}