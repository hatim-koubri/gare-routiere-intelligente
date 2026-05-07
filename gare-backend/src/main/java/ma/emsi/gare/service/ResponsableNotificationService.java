package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.NotificationTrajetRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.messaging.NotificationProducer;
import ma.emsi.gare.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableNotificationService {

    private final TrajetRepository trajetRepository;
    private final NotificationOfflineRepository notificationRepository;
    private final CompagnieRepository compagnieRepository;
    private final NotificationProducer notificationProducer;

    public void notifierVoyageurs(
            NotificationTrajetRequest request,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Trajet trajet = trajetRepository.findById(
                        request.getTrajetId()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Trajet introuvable"
                        ));

        Long compagnieId =
                trajet.getLigne()
                        .getCompagnie()
                        .getId();

        if (!compagnieId.equals(compagnie.getId())) {
            throw new IllegalArgumentException(
                    "Trajet inaccessible"
            );
        }

        List<Reservation> reservations =
                trajet.getReservations();

        for (Reservation reservation : reservations) {

            Voyageur voyageur =
                    reservation.getVoyageur();

            if (voyageur == null) {
                continue;
            }

            NotificationOffline notification =
                    new NotificationOffline();

            notification.setUserEmail(
                    voyageur.getEmail()
            );

            notification.setMessage(
                    request.getMessage()
            );

            notification.setPayload(
                    "TRAJET_ID=" + trajet.getId()
            );

            notification.setType(
                    request.getType()
            );

            notification.setLivree(false);

            notificationRepository.save(notification);

            notificationProducer.envoyerNotification(
                    request.getMessage()
                            + " | "
                            + voyageur.getEmail()
            );
        }
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException(
                    "Utilisateur invalide"
            );
        }

        Long compagnieId =
                responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Compagnie introuvable"
                        ));
    }
}