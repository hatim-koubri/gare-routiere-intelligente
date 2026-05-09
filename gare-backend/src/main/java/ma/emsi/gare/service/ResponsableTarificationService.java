package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.TarificationDynamiqueRequest;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.entity.TarificationDynamique;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.TarificationDynamiqueRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableTarificationService {

    private final TarificationDynamiqueRepository repository;
    private final CompagnieRepository compagnieRepository;

    public TarificationDynamique configurer(
            TarificationDynamiqueRequest request,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        TarificationDynamique config =
                repository.findByCompagnieId(compagnie.getId())
                        .orElse(new TarificationDynamique());

        config.setReductionTrenteJours(
                request.getReductionTrenteJours()
        );

        config.setReductionQuinzeJours(
                request.getReductionQuinzeJours()
        );

        config.setSupplementJourMeme(
                request.getSupplementJourMeme()
        );

        config.setSeuilHaut(
                request.getSeuilHaut()
        );

        config.setSupplementHaut(
                request.getSupplementHaut()
        );

        config.setSeuilBas(
                request.getSeuilBas()
        );

        config.setReductionBas(
                request.getReductionBas()
        );

        config.setCompagnie(compagnie);

        return repository.save(config);
    }

    @Transactional(readOnly = true)
    public TarificationDynamique getConfiguration(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        return repository.findByCompagnieId(compagnie.getId())
                .orElse(new TarificationDynamique());
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