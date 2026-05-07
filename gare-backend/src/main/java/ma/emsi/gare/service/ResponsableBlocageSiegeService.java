package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.BlocageSiegeRequest;
import ma.emsi.gare.entity.*;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.SiegeRepository;
import ma.emsi.gare.repository.TrajetRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableBlocageSiegeService {

    private final SiegeRepository siegeRepository;
    private final TrajetRepository trajetRepository;
    private final CompagnieRepository compagnieRepository;

    public Siege bloquer(
            BlocageSiegeRequest request,
            Authentication authentication
    ) {

        Trajet trajet =
                getTrajetResponsable(
                        request.getTrajetId(),
                        authentication
                );

        Siege siege =
                siegeRepository.findByTrajetIdAndNumeroSiege(
                                trajet.getId(),
                                request.getNumeroSiege()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Siège introuvable"
                                ));

        siege.setBloque(true);

        siege.setMotifBlocage(
                request.getMotifBlocage()
        );

        siege.setDateBlocage(
                LocalDateTime.now()
        );

        return siegeRepository.save(siege);
    }

    public Siege debloquer(
            Long siegeId,
            Authentication authentication
    ) {

        Siege siege =
                siegeRepository.findById(siegeId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Siège introuvable"
                                ));

        Long compagnieId =
                siege.getTrajet()
                        .getLigne()
                        .getCompagnie()
                        .getId();

        Compagnie compagnie =
                getCompagnie(authentication);

        if (!compagnieId.equals(compagnie.getId())) {

            throw new IllegalArgumentException(
                    "Siège inaccessible"
            );
        }

        siege.setBloque(false);

        siege.setMotifBlocage(null);

        siege.setDateBlocage(null);

        return siegeRepository.save(siege);
    }

    @Transactional(readOnly = true)
    public List<Siege> getSiegesBloques(
            Long trajetId,
            Authentication authentication
    ) {

        getTrajetResponsable(trajetId, authentication);

        return siegeRepository.findByTrajetId(trajetId)
                .stream()
                .filter(Siege::isBloque)
                .toList();
    }

    private Trajet getTrajetResponsable(
            Long trajetId,
            Authentication authentication
    ) {

        Compagnie compagnie =
                getCompagnie(authentication);

        Trajet trajet =
                trajetRepository.findById(trajetId)
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

        return trajet;
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