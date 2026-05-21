package ma.emsi.gare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.request.ReponseReclamationRequest;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.Reclamation;
import ma.emsi.gare.enums.StatutReclamation;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.ReclamationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final CompagnieRepository compagnieRepository;
    private final NotificationOfflineService notificationOfflineService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Transactional(readOnly = true)
    public List<Reclamation> getMesReclamations(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        List<Reclamation> viaReservation = reclamationRepository
                .findByReservationTrajetLigneCompagnieId(
                        compagnie.getId()
                );

        List<Reclamation> viaCompagnie = reclamationRepository
                .findByCompagnieIdOrderByDateCreationDesc(
                        compagnie.getId()
                );

        return Stream.concat(viaReservation.stream(), viaCompagnie.stream())
                .distinct()
                .toList();
    }

    public Reclamation repondre(
            Long id,
            ReponseReclamationRequest request,
            Authentication authentication
    ) {

        Reclamation reclamation =
                getReclamationResponsable(id, authentication);

        reclamation.setStatut(request.getStatut());

        reclamation.setReponseResponsable(
                request.getReponseResponsable()
        );

        Reclamation saved = reclamationRepository.save(reclamation);
        notifierVoyageurReclamation(saved);
        return saved;
    }

    @Transactional(readOnly = true)
    public Reclamation getById(
            Long id,
            Authentication authentication
    ) {
        return getReclamationResponsable(id, authentication);
    }

    public Reclamation resoudre(
            Long id,
            Authentication authentication
    ) {
        Reclamation reclamation =
                getReclamationResponsable(id, authentication);

        reclamation.setStatut(StatutReclamation.RESOLUE);

        Reclamation saved = reclamationRepository.save(reclamation);
        notifierVoyageurReclamation(saved);
        return saved;
    }

    private void notifierVoyageurReclamation(Reclamation reclamation) {
        try {
            String email = reclamation.getVoyageur().getEmail();
            String statut = reclamation.getStatut().name();
            String message = "Votre réclamation #" + reclamation.getId()
                    + " a été " + (statut.equals("RESOLUE") ? "résolue" : "traitée")
                    + ".";
            if (reclamation.getReponseResponsable() != null) {
                message += " Réponse : " + reclamation.getReponseResponsable();
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("reclamationId", reclamation.getId());
            payload.put("statut", statut);
            payload.put("type", reclamation.getType().name());
            payload.put("sujet", reclamation.getSujet());

            String payloadJson = new ObjectMapper().writeValueAsString(payload);

            notificationOfflineService.creerNotification(
                    email,
                    TypeNotification.RECLAMATION_TRAITEE,
                    message,
                    payloadJson
            );
            webSocketNotificationService.notifierVoyageur(
                    email,
                    TypeNotification.RECLAMATION_TRAITEE.name(),
                    message
            );
        } catch (Exception e) {
            log.error("Erreur envoi notification réclamation #{}", reclamation.getId(), e);
        }
    }

    private Reclamation getReclamationResponsable(
            Long reclamationId,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Reclamation reclamation =
                reclamationRepository.findById(reclamationId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Réclamation introuvable"
                                ));

        boolean sameCompagnie;
        if (reclamation.getReservation() != null) {
            Long compagnieIdViaReservation =
                    reclamation.getReservation()
                            .getTrajet()
                            .getLigne()
                            .getCompagnie()
                            .getId();
            sameCompagnie = compagnieIdViaReservation.equals(compagnie.getId());
        } else if (reclamation.getCompagnie() != null) {
            sameCompagnie = reclamation.getCompagnie().getId().equals(compagnie.getId());
        } else {
            sameCompagnie = false;
        }

        if (!sameCompagnie) {
            throw new IllegalArgumentException(
                    "Réclamation inaccessible"
            );
        }

        return reclamation;
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie responsable)) {
            throw new IllegalStateException("Utilisateur invalide");
        }

        Long compagnieId = responsable.getCompagnie().getId();

        return compagnieRepository.findById(compagnieId)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Compagnie introuvable"
                        ));
    }
}