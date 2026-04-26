package ma.emsi.gare.controller.voyageur;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ReservationRequest;
import ma.emsi.gare.dto.request.VerrouillageSiegeRequest;
import ma.emsi.gare.dto.response.ReservationResponseDTO;
import ma.emsi.gare.dto.response.SiegeResponseDTO;
import ma.emsi.gare.service.ReservationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/voyageur/reservations")
@RequiredArgsConstructor
public class VoyageurReservationController {

    private final ReservationService reservationService;

    @PostMapping
    public ReservationResponseDTO creerReservation(
            @RequestBody ReservationRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return reservationService.creerReservationParEmail(email, request);
    }

    @GetMapping("/trajets/{trajetId}/plan-bus")
    public List<SiegeResponseDTO> getPlanBus(@PathVariable Long trajetId) {
        return reservationService.getPlanBus(trajetId);
    }

    @GetMapping("/trajets/{trajetId}/proposition")
    public List<String> proposerSieges(
            @PathVariable Long trajetId,
            @RequestParam int nombrePlaces
    ) {
        return reservationService.proposerSiegesGroupe(trajetId, nombrePlaces);
    }

    @PostMapping("/verrouiller")
    public void verrouillerSieges(@RequestBody VerrouillageSiegeRequest request) {
        reservationService.verrouillerSieges(request);
    }

}