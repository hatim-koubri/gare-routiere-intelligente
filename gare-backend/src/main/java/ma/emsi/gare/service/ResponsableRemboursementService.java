package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.TraitementRemboursementRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.enums.StatutRemboursement;
import ma.emsi.gare.enums.StatutReservation;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.RemboursementRepository;
import ma.emsi.gare.repository.ReservationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableRemboursementService {

    private final RemboursementRepository repository;
    private final ReservationRepository reservationRepository;
    private final CompagnieRepository compagnieRepository;

    @Transactional(readOnly = true)
    public List<Remboursement> getDemandes(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        return repository
                .findByReservationTrajetLigneCompagnieId(
                        compagnie.getId()
                );
    }

    @Transactional(readOnly = true)
    public Remboursement getById(
            Long remboursementId,
            Authentication authentication
    ) {

        return getRemboursementResponsable(
                remboursementId,
                authentication
        );
    }

    public Remboursement accepter(
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

        return repository.save(remboursement);
    }

    public Remboursement refuser(
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

        return repository.save(remboursement);
    }

    public Remboursement traiter(
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

        return repository.save(remboursement);
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