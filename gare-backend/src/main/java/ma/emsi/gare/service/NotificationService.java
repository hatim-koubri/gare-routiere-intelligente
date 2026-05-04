package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.repository.ReservationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final ReservationRepository reservationRepository;

    @Scheduled(fixedRate = 60000) // every 1 minute
    public void envoyerRappels() {

        List<Reservation> reservations = reservationRepository.findAll();

        for (Reservation r : reservations) {

            if (!r.getStatut().name().equals("CONFIRMEE")) continue;

            long minutes = Duration
                    .between(LocalDateTime.now(), r.getTrajet().getDateDepart())
                    .toMinutes();

            if (minutes == 1440) {
                notifier(r, "Votre trajet démarre dans 24h");
            } else if (minutes == 120) {
                notifier(r, "Votre trajet démarre dans 2h");
            } else if (minutes == 30) {
                notifier(r, "Votre trajet démarre dans 30 minutes");
            } else if (minutes == 5) {
                notifier(r, "Votre trajet démarre dans 5 minutes");
            }
        }
    }

    private void notifier(Reservation r, String message) {
        System.out.println("📢 Notification pour Reservation " + r.getId() + ": " + message);
    }
}