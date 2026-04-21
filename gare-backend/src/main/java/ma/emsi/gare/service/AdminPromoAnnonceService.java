package ma.emsi.gare.service;

import lombok.RequiredArgsConstructor;
import ma.emsi.gare.dto.request.AnnonceRequest;
import ma.emsi.gare.dto.request.CodePromoRequest;
import ma.emsi.gare.entity.Annonce;
import ma.emsi.gare.entity.CodePromo;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.repository.AnnonceRepository;
import ma.emsi.gare.repository.CodePromoRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPromoAnnonceService {

    private final CodePromoRepository codePromoRepository;
    private final AnnonceRepository annonceRepository;
    private final CompagnieRepository compagnieRepository;

    // ===== T2-11 — Codes Promo =====

    public CodePromo creerCodePromo(CodePromoRequest request) {
        if (codePromoRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Code promo déjà existant");
        }

        CodePromo promo = new CodePromo();
        promo.setCode(request.getCode().toUpperCase());
        promo.setPourcentageReduction(request.getPourcentageReduction());
        promo.setDateExpiration(request.getDateExpiration());
        promo.setNbUtilisationsMax(request.getNbUtilisationsMax());
        promo.setNbUtilisationsActuel(0);
        promo.setActif(true);

        if (request.getCompagnieId() != null) {
            Compagnie compagnie = compagnieRepository
                    .findById(request.getCompagnieId())
                    .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));
            promo.setCompagnie(compagnie);
        }

        return codePromoRepository.save(promo);
    }

    public CodePromo validerCodePromo(String code) {
        CodePromo promo = codePromoRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Code promo invalide"));

        if (!promo.isActif()) {
            throw new RuntimeException("Code promo désactivé");
        }
        if (promo.getDateExpiration().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Code promo expiré");
        }
        if (promo.getNbUtilisationsMax() != null &&
                promo.getNbUtilisationsActuel() >= promo.getNbUtilisationsMax()) {
            throw new RuntimeException("Code promo épuisé");
        }

        return promo;
    }

    public CodePromo desactiverCodePromo(Long id) {
        CodePromo promo = codePromoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Code promo non trouvé"));
        promo.setActif(false);
        return codePromoRepository.save(promo);
    }

    public List<CodePromo> getCodesPromosActifs() {
        return codePromoRepository.findByActifTrueAndDateExpirationAfter(
                LocalDateTime.now());
    }

    // ===== T2-12 — Annonces bilingues =====

    public Annonce creerAnnonce(AnnonceRequest request) {
        Annonce annonce = new Annonce();
        annonce.setTitreFr(request.getTitreFr());
        annonce.setTitreAr(request.getTitreAr());
        annonce.setContenuFr(request.getContenuFr());
        annonce.setContenuAr(request.getContenuAr());
        annonce.setDateDebut(request.getDateDebut());
        annonce.setDateFin(request.getDateFin());
        annonce.setActive(true);

        if (request.getCompagnieId() != null) {
            Compagnie compagnie = compagnieRepository
                    .findById(request.getCompagnieId())
                    .orElseThrow(() -> new RuntimeException("Compagnie non trouvée"));
            annonce.setCompagnie(compagnie);
        }

        return annonceRepository.save(annonce);
    }

    public List<Annonce> getAnnoncesActives() {
        return annonceRepository.findAnnoncesActives(LocalDateTime.now());
    }

    public Annonce desactiverAnnonce(Long id) {
        Annonce annonce = annonceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Annonce non trouvée"));
        annonce.setActive(false);
        return annonceRepository.save(annonce);
    }
}