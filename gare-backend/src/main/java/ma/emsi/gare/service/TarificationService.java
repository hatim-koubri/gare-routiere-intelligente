package ma.emsi.gare.service;

import lombok.extern.slf4j.Slf4j;
import ma.emsi.gare.enums.CategorieTarifaire;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
public class TarificationService {

    // ===== Règles tarifaires configurables =====
    // (Sprint 6 : ces valeurs viendront de la BDD par compagnie)
    private double reductionTrenteJours  = 20.0;
    private double reductionQuinzeJours  = 10.0;
    private double supplementJourMeme    = 10.0;
    private double seuilHaut             = 80.0;
    private double supplementHaut        = 15.0;
    private double seuilBas              = 30.0;
    private double reductionBas          = 10.0;

    // =============================================
    // T2-08 — Tarification par délai de réservation
    // =============================================
    public double calculerPrixAvecDelai(double prixBase,
                                        LocalDateTime dateDepart) {
        long joursAvantDepart = ChronoUnit.DAYS.between(
                LocalDateTime.now(), dateDepart);

        double prix = prixBase;
        double pourcentage = 0;

        if (joursAvantDepart >= 30) {
            pourcentage = -reductionTrenteJours;  // -20%
        } else if (joursAvantDepart >= 15) {
            pourcentage = -reductionQuinzeJours;  // -10%
        } else if (joursAvantDepart < 1) {
            pourcentage = supplementJourMeme;      // +10%
        }
        // entre 2 et 14 jours → prix normal (0%)

        prix = prixBase * (1 + pourcentage / 100);
        log.debug("Tarif délai: {}j → {}% → {} MAD",
                joursAvantDepart, pourcentage, prix);
        return arrondir(prix);
    }

    // =============================================
    // T2-09 — Smart Pricing par taux de remplissage
    // =============================================
    public double calculerPrixAvecRemplissage(double prixActuel,
                                              int nbSiegesTotal,
                                              int nbSiegesOccupes) {
        if (nbSiegesTotal == 0) return prixActuel;

        double tauxRemplissage = (double) nbSiegesOccupes
                / nbSiegesTotal * 100;
        double prix = prixActuel;
        double pourcentage = 0;

        if (tauxRemplissage > seuilHaut) {
            pourcentage = supplementHaut;   // +15%
        } else if (tauxRemplissage < seuilBas) {
            pourcentage = -reductionBas;    // -10%
        }

        prix = prixActuel * (1 + pourcentage / 100);
        log.debug("Smart pricing: {}% remplissage → {}% → {} MAD",
                tauxRemplissage, pourcentage, prix);
        return arrondir(prix);
    }

    // =============================================
    // T2-10 — Catégories tarifaires
    // =============================================
    public double appliquerCategorie(double prix,
                                     CategorieTarifaire categorie) {
        double reduction = switch (categorie) {
            case ETUDIANT  -> 25.0;  // -25%
            case ENFANT    -> 50.0;  // -50%
            case MILITAIRE -> 30.0;  // -30%
            case SENIOR    -> 20.0;  // -20%
            case NORMAL    -> 0.0;
        };
        return arrondir(prix * (1 - reduction / 100));
    }

    // =============================================
    // Calcul COMPLET (délai + remplissage + catégorie)
    // =============================================
    public double calculerPrixFinal(double prixBase,
                                    LocalDateTime dateDepart,
                                    int nbSiegesTotal,
                                    int nbSiegesOccupes,
                                    CategorieTarifaire categorie,
                                    Double pourcentagePromo) {
        // Étape 1 — Prix de base avec délai
        double prix = calculerPrixAvecDelai(prixBase, dateDepart);

        // Étape 2 — Smart pricing remplissage
        prix = calculerPrixAvecRemplissage(prix, nbSiegesTotal, nbSiegesOccupes);

        // Étape 3 — Catégorie tarifaire
        prix = appliquerCategorie(prix, categorie);

        // Étape 4 — Code promo
        if (pourcentagePromo != null && pourcentagePromo > 0) {
            prix = prix * (1 - pourcentagePromo / 100);
        }

        return arrondir(prix);
    }

    // =============================================
    // Configurer les règles (appelé par l'admin)
    // =============================================
    public void configurerRegles(double reductionTrenteJours,
                                 double reductionQuinzeJours,
                                 double supplementJourMeme,
                                 double seuilHaut,
                                 double supplementHaut,
                                 double seuilBas,
                                 double reductionBas) {
        this.reductionTrenteJours = reductionTrenteJours;
        this.reductionQuinzeJours = reductionQuinzeJours;
        this.supplementJourMeme   = supplementJourMeme;
        this.seuilHaut            = seuilHaut;
        this.supplementHaut       = supplementHaut;
        this.seuilBas             = seuilBas;
        this.reductionBas         = reductionBas;
        log.info("Règles tarifaires mises à jour");
    }

    private double arrondir(double prix) {
        return Math.round(prix * 100.0) / 100.0;
    }
}