package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.AnnonceRequest;
import ma.emsi.gare.entity.Annonce;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.AnnonceRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableAnnonceService {

    private final AnnonceRepository annonceRepository;
    private final CompagnieRepository compagnieRepository;

    public Annonce creer(
            AnnonceRequest request,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Annonce annonce = new Annonce();

        annonce.setTitreFr(request.getTitreFr());

        annonce.setTitreAr(request.getTitreAr());

        annonce.setContenuFr(request.getContenuFr());

        annonce.setContenuAr(request.getContenuAr());

        annonce.setDateDebut(request.getDateDebut());

        annonce.setDateFin(request.getDateFin());

        annonce.setActive(true);

        annonce.setCompagnie(compagnie);

        return annonceRepository.save(annonce);
    }

    public Annonce modifier(
            Long id,
            AnnonceRequest request,
            Authentication authentication
    ) {

        Annonce annonce =
                getAnnonceResponsable(id, authentication);

        annonce.setTitreFr(request.getTitreFr());

        annonce.setTitreAr(request.getTitreAr());

        annonce.setContenuFr(request.getContenuFr());

        annonce.setContenuAr(request.getContenuAr());

        annonce.setDateDebut(request.getDateDebut());

        annonce.setDateFin(request.getDateFin());

        return annonceRepository.save(annonce);
    }

    public Annonce toggleEtat(
            Long id,
            Authentication authentication
    ) {
        Annonce annonce =
                getAnnonceResponsable(id, authentication);

        annonce.setActive(!annonce.isActive());

        return annonceRepository.save(annonce);
    }

    public Annonce changerEtat(
            Long id,
            boolean active,
            Authentication authentication
    ) {

        Annonce annonce =
                getAnnonceResponsable(id, authentication);

        annonce.setActive(active);

        return annonceRepository.save(annonce);
    }

    @Transactional(readOnly = true)
    public List<Annonce> getMesAnnonces(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        return annonceRepository.findByCompagnieId(
                compagnie.getId()
        );
    }

    private Annonce getAnnonceResponsable(
            Long annonceId,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        Annonce annonce =
                annonceRepository.findById(annonceId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Annonce introuvable"
                                ));

        if (!annonce.getCompagnie().getId()
                .equals(compagnie.getId())) {

            throw new IllegalArgumentException(
                    "Annonce inaccessible"
            );
        }

        return annonce;
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