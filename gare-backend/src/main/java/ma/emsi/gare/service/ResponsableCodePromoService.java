package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.CodePromoRequest;
import ma.emsi.gare.entity.CodePromo;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.ResponsableCompagnie;
import ma.emsi.gare.repository.CodePromoRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ResponsableCodePromoService {

    private final CodePromoRepository codePromoRepository;
    private final CompagnieRepository compagnieRepository;

    public CodePromo creer(
            CodePromoRequest request,
            Authentication authentication
    ) {

        if (codePromoRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException(
                    "Code promo déjà utilisé"
            );
        }

        if (request.getDateExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Date expiration invalide"
            );
        }

        Compagnie compagnie = getCompagnie(authentication);

        CodePromo promo = new CodePromo();

        promo.setCode(request.getCode());

        promo.setPourcentageReduction(
                request.getPourcentageReduction()
        );

        promo.setDateExpiration(request.getDateExpiration());

        promo.setNbUtilisationsMax(
                request.getNbUtilisationsMax()
        );

        promo.setNbUtilisationsActuel(0);

        promo.setActif(true);

        promo.setCompagnie(compagnie);

        return codePromoRepository.save(promo);
    }

    public CodePromo activer(
            Long id,
            Authentication authentication
    ) {
        CodePromo promo = getPromoResponsable(id, authentication);

        if (promo.getDateExpiration().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Impossible de réactiver un code promo expiré"
            );
        }

        promo.setActif(true);

        return codePromoRepository.save(promo);
    }

    public CodePromo desactiver(
            Long id,
            Authentication authentication
    ) {

        CodePromo promo = getPromoResponsable(id, authentication);

        promo.setActif(false);

        return codePromoRepository.save(promo);
    }

    @Transactional(readOnly = true)
    public List<CodePromo> getMesCodes(
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        return codePromoRepository.findByCompagnieId(
                compagnie.getId()
        );
    }

    private CodePromo getPromoResponsable(
            Long promoId,
            Authentication authentication
    ) {

        Compagnie compagnie = getCompagnie(authentication);

        CodePromo promo = codePromoRepository.findById(promoId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Code promo introuvable"
                        ));

        if (!promo.getCompagnie().getId().equals(compagnie.getId())) {
            throw new IllegalArgumentException(
                    "Ce code promo n'appartient pas à votre compagnie"
            );
        }

        return promo;
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