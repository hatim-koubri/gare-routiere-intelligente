package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.entity.Reservation;
import ma.emsi.gare.entity.Voyageur;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.ReservationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final ReservationRepository reservationRepository;
    private final NotificationOfflineService notificationOfflineService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Scheduled(fixedRate = 60000)
    @Transactional(readOnly = true)
    public void envoyerRappels() {

        List<Reservation> reservations = reservationRepository.findAll();

        for (Reservation r : reservations) {

            if (!r.getStatut().name().equals("CONFIRMEE")) continue;

            long minutes = Duration
                    .between(LocalDateTime.now(), r.getTrajet().getDateDepart())
                    .toMinutes();

            if (minutes == 1440) {
                notifier(r, "Votre trajet démarre dans 24h", TypeNotification.RAPPEL_DEPART);
            } else if (minutes == 120) {
                notifier(r, "Votre trajet démarre dans 2h", TypeNotification.RAPPEL_DEPART);
            } else if (minutes == 30) {
                notifier(r, "Votre trajet démarre dans 30 minutes", TypeNotification.RAPPEL_DEPART);
            } else if (minutes == 5) {
                notifier(r, "Votre trajet démarre dans 5 minutes", TypeNotification.RAPPEL_DEPART);
            }
        }
    }

    private void notifier(Reservation r, String message, TypeNotification type) {
        Voyageur voyageur = r.getVoyageur();
        String email = voyageur.getEmail();
        notificationOfflineService.creerNotification(email, type, message, "reservation:" + r.getId());
        webSocketNotificationService.notifierVoyageur(email, type.name(), message);
    }
}