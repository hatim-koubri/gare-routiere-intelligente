package ma.emsi.gare.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.NotificationTrajetRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.messaging.NotificationProducer;
import ma.emsi.gare.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableNotificationService {

    private final TrajetRepository trajetRepository;
    private final NotificationOfflineRepository notificationRepository;
    private final CompagnieRepository compagnieRepository;
    private final NotificationProducer notificationProducer;
    private final ObjectMapper objectMapper;

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

        String villeDepart = trajet.getLigne().getVilleDepart();
        String villeArrivee = trajet.getLigne().getVilleArrivee();
        String compagnieNom = trajet.getLigne().getCompagnie().getNom();
        String dateDepartStr = trajet.getDateDepart() != null
                ? trajet.getDateDepart().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "";
        Integer quaiNumero = trajet.getQuai() != null ? trajet.getQuai().getNumero() : null;

        String message = String.format(
                "[%s] %s → %s | %s | %s\n\n%s",
                request.getType(),
                villeDepart,
                villeArrivee,
                dateDepartStr,
                compagnieNom,
                request.getMessage()
        );

        Map<String, Object> payloadMap = new LinkedHashMap<>();
        payloadMap.put("trajetId", trajet.getId());
        payloadMap.put("villeDepart", villeDepart);
        payloadMap.put("villeArrivee", villeArrivee);
        payloadMap.put("dateDepart", trajet.getDateDepart() != null ? trajet.getDateDepart().toString() : null);
        payloadMap.put("dateArriveePrevue", trajet.getDateArriveePrevue() != null ? trajet.getDateArriveePrevue().toString() : null);
        payloadMap.put("compagnieNom", compagnieNom);
        payloadMap.put("quaiNumero", quaiNumero);
        payloadMap.put("busMatricule", trajet.getBus() != null ? trajet.getBus().getMatricule() : null);

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payloadMap);
        } catch (JsonProcessingException e) {
            payloadJson = "{\"trajetId\":" + trajet.getId() + "}";
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

            notification.setMessage(message);

            notification.setPayload(payloadJson);

            notification.setType(
                    request.getType()
            );

            notification.setLivree(false);

            notificationRepository.save(notification);

            notificationProducer.envoyerNotification(
                    message
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