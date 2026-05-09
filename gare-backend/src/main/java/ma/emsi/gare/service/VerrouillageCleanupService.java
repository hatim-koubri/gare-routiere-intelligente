package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.SiegeRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerrouillageCleanupService {

    private final SiegeRepository siegeRepository;
    private final ReservationRepository reservationRepository;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void libererVerrousExpires() {
        LocalDateTime expiration = LocalDateTime.now().minusMinutes(10);

        int nbLiberes = siegeRepository.libererSiegesExpires(expiration);
        if (nbLiberes > 0) {
            log.info("{} verrou(s) de siege expire(s) libere(s)", nbLiberes);
        }

        List<Reservation> expirees = reservationRepository.findExpiredEnAttente(expiration);
        for (Reservation r : expirees) {
            r.setStatut(StatutReservation.ANNULEE);
            reservationRepository.save(r);
            log.info("Reservation {} annulee (paiement expire)", r.getId());
        }
    }
}
