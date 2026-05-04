package ma.emsi.gare.controller.admin;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.repository.ReservationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/admin/reservations")
@RequiredArgsConstructor
public class AdminReservationController {

    private final ReservationRepository reservationRepository;

    @GetMapping
    public Page<ReservationAdminDTO> getReservations(Pageable pageable) {
        return reservationRepository.findAll(pageable)
                .map(this::toDto);
    }

    private ReservationAdminDTO toDto(Reservation reservation) {
        return new ReservationAdminDTO(
                reservation.getId(),
                reservation.getVoyageur().getId(),
                reservation.getVoyageur().getEmail(),
                reservation.getTrajet().getId(),
                reservation.getDateReservation(),
                reservation.getPrixTotal(),
                reservation.getStatut().name(),
                reservation.getNbModif()
        );
    }

    public record ReservationAdminDTO(
            Long id,
            Long voyageurId,
            String voyageurEmail,
            Long trajetId,
            LocalDateTime dateReservation,
            Double prixTotal,
            String statut,
            Integer nbModif
    ) {
    }
}