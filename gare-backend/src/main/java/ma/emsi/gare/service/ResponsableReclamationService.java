package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.ReponseReclamationRequest;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.Reclamation;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.ReclamationRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableReclamationService {

    private final ReclamationRepository reclamationRepository;
    private final CompagnieRepository compagnieRepository;

    @Transactional(readOnly = true)
    public List<Reclamation> getMesReclamations(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        return reclamationRepository
                .findByReservationTrajetLigneCompagnieId(
                        compagnie.getId()
                );
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

        return reclamationRepository.save(reclamation);
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

        Long compagnieId =
                reclamation.getReservation()
                        .getTrajet()
                        .getLigne()
                        .getCompagnie()
                        .getId();

        if (!compagnieId.equals(compagnie.getId())) {
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