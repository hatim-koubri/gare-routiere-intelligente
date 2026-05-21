package ma.emsi.gare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.dto.request.TraitementRemboursementRequest;
import ma.emsi.gare.dto.response.RemboursementResponseDTO;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutRemboursement;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.enums.TypeNotification;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.RemboursementRepository;
import ma.emsi.gare.repository.ReservationRepository;
import ma.emsi.gare.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableRemboursementService {

    private final RemboursementRepository repository;
    private final ReservationRepository reservationRepository;
    private final CompagnieRepository compagnieRepository;
    private final UserRepository userRepository;
    private final NotificationOfflineService notificationOfflineService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Transactional(readOnly = true)
    public List<RemboursementResponseDTO> getDemandes(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        return repository
                .findByReservationTrajetLigneCompagnieId(
                        compagnie.getId()
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RemboursementResponseDTO getById(
            Long remboursementId,
            Authentication authentication
    ) {

        return toDto(getRemboursementResponsable(
                remboursementId,
                authentication
        ));
    }

    public RemboursementResponseDTO accepter(
            Long remboursementId,
            Authentication authentication
    ) {

        Remboursement remboursement =
                getRemboursementResponsable(
                        remboursementId,
                        authentication
                );

        remboursement.setStatut(
                StatutRemboursement.ACCEPTE
        );

        remboursement.setDateTraitement(
                LocalDateTime.now()
        );

        if (!remboursement.isPartiel()) {
            Reservation reservation =
                    remboursement.getReservation();
            reservation.setStatut(
                    StatutReservation.REMBOURSEE
            );
            reservationRepository.save(reservation);
        }

        Remboursement saved = repository.save(remboursement);
        notifierVoyageurRemboursement(saved, "accepté");
        return toDto(saved);
    }

    public RemboursementResponseDTO refuser(
            Long remboursementId,
            Authentication authentication
    ) {

        Remboursement remboursement =
                getRemboursementResponsable(
                        remboursementId,
                        authentication
                );

        remboursement.setStatut(
                StatutRemboursement.REFUSE
        );

        remboursement.setDateTraitement(
                LocalDateTime.now()
        );

        Remboursement saved = repository.save(remboursement);
        notifierVoyageurRemboursement(saved, "refusé");
        return toDto(saved);
    }

    private void notifierVoyageurRemboursement(Remboursement remboursement, String action) {
        try {
            String email = remboursement.getReservation().getVoyageur().getEmail();
            String message = "Votre demande de remboursement #" + remboursement.getId()
                    + " a été " + action + "."
                    + " Montant : " + remboursement.getMontant() + " MAD";

            Map<String, Object> payload = new HashMap<>();
            payload.put("remboursementId", remboursement.getId());
            payload.put("statut", remboursement.getStatut().name());
            payload.put("montant", remboursement.getMontant());
            payload.put("reservationId", remboursement.getReservation().getId());

            String payloadJson = new ObjectMapper().writeValueAsString(payload);

            notificationOfflineService.creerNotification(
                    email,
                    TypeNotification.REMBOURSEMENT_TRAITE,
                    message,
                    payloadJson
            );
            webSocketNotificationService.notifierVoyageur(
                    email,
                    TypeNotification.REMBOURSEMENT_TRAITE.name(),
                    message
            );
        } catch (Exception e) {
            log.error("Erreur envoi notification remboursement #{}", remboursement.getId(), e);
        }
    }

    public RemboursementResponseDTO traiter(
            Long remboursementId,
            TraitementRemboursementRequest request,
            Authentication authentication
    ) {

        Remboursement remboursement =
                getRemboursementResponsable(
                        remboursementId,
                        authentication
                );

        remboursement.setStatut(request.getStatut());

        remboursement.setDateTraitement(
                LocalDateTime.now()
        );

        if (request.getStatut()
                == StatutRemboursement.ACCEPTE
                && !remboursement.isPartiel()) {

            Reservation reservation =
                    remboursement.getReservation();
            reservation.setStatut(
                    StatutReservation.REMBOURSEE
            );
            reservationRepository.save(reservation);
        }

        Remboursement saved = repository.save(remboursement);
        String action = request.getStatut() == StatutRemboursement.ACCEPTE ? "accepté" : "refusé";
        notifierVoyageurRemboursement(saved, action);
        return toDto(saved);
    }

    private RemboursementResponseDTO toDto(Remboursement remboursement) {
        RemboursementResponseDTO dto = new RemboursementResponseDTO();
        dto.setId(remboursement.getId());
        dto.setMontant(remboursement.getMontant());
        dto.setMotif(remboursement.getMotif());
        dto.setStatut(remboursement.getStatut());
        dto.setDateDemande(remboursement.getDateDemande());
        dto.setDateTraitement(remboursement.getDateTraitement());

        if (remboursement.getReservation() != null) {
            dto.setReservationId(remboursement.getReservation().getId());
            if (remboursement.getReservation().getVoyageur() != null) {
                dto.setVoyageurId(remboursement.getReservation().getVoyageur().getId());
                dto.setVoyageurNom(remboursement.getReservation().getVoyageur().getNom());
                dto.setVoyageurPrenom(remboursement.getReservation().getVoyageur().getPrenom());
            }
        }

        return dto;
    }

    private Remboursement getRemboursementResponsable(
            Long remboursementId,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Remboursement remboursement =
                repository.findById(remboursementId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Remboursement introuvable"
                                ));

        Long compagnieId =
                remboursement.getReservation()
                        .getTrajet()
                        .getLigne()
                        .getCompagnie()
                        .getId();

        if (!compagnieId.equals(compagnie.getId())) {

            throw new IllegalArgumentException(
                    "Remboursement inaccessible"
            );
        }

        return remboursement;
    }

    private Compagnie getCompagnie(Authentication authentication) {

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof ResponsableCompagnie)) {
            throw new IllegalStateException(
                    "Utilisateur invalide"
            );
        }

        ResponsableCompagnie responsable =
                (ResponsableCompagnie) userRepository
                        .findByEmail(authentication.getName())
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Utilisateur introuvable"
                                ));

        return responsable.getCompagnie();
    }
}