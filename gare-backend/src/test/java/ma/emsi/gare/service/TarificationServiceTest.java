package ma.emsi.gare.service;

import ma.emsi.gare.enums.CategorieTarifaire;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.*;

@DisplayName("TarificationService — Tests unitaires")
class TarificationServiceTest {

    private TarificationService tarificationService;

    @BeforeEach
    void setUp() {
        tarificationService = new TarificationService();
    }

    // ===== Tests délai de réservation =====

    @Test
    @DisplayName("30 jours avant départ → -20%")
    void calculerPrixAvecDelai_TrenteJours_Reduction20() {
        double prix = tarificationService.calculerPrixAvecDelai(
                100.0,
                LocalDateTime.now().plusDays(31)
        );
        assertThat(prix).isEqualTo(80.0);
    }

    @Test
    @DisplayName("15 jours avant départ → -10%")
    void calculerPrixAvecDelai_QuinzeJours_Reduction10() {
        double prix = tarificationService.calculerPrixAvecDelai(
                100.0,
                LocalDateTime.now().plusDays(15)
        );
        assertThat(prix).isEqualTo(90.0);
    }

    @Test
    @DisplayName("Jour même → +10%")
    void calculerPrixAvecDelai_JourMeme_Supplement10() {
        double prix = tarificationService.calculerPrixAvecDelai(
                100.0,
                LocalDateTime.now().plusHours(2)
        );
        assertThat(prix).isEqualTo(110.0);
    }

    @Test
    @DisplayName("7 jours avant → prix normal")
    void calculerPrixAvecDelai_SeptJours_PrixNormal() {
        double prix = tarificationService.calculerPrixAvecDelai(
                100.0,
                LocalDateTime.now().plusDays(7)
        );
        assertThat(prix).isEqualTo(100.0);
    }

    // ===== Tests Smart Pricing =====

    @Test
    @DisplayName("Remplissage > 80% → +15%")
    void smartPricing_RemplissageEleve_Supplement() {
        // 41 sièges occupés sur 45 = 91%
        double prix = tarificationService.calculerPrixAvecRemplissage(
                100.0, 45, 41
        );
        assertThat(prix).isEqualTo(115.0);
    }

    @Test
    @DisplayName("Remplissage < 30% → -10%")
    void smartPricing_RemplissageBas_Reduction() {
        // 10 sièges occupés sur 45 = 22%
        double prix = tarificationService.calculerPrixAvecRemplissage(
                100.0, 45, 10
        );
        assertThat(prix).isEqualTo(90.0);
    }

    @Test
    @DisplayName("Remplissage normal (50%) → prix inchangé")
    void smartPricing_RemplissageNormal_PrixInchange() {
        // 22 sièges occupés sur 45 = 49%
        double prix = tarificationService.calculerPrixAvecRemplissage(
                100.0, 45, 22
        );
        assertThat(prix).isEqualTo(100.0);
    }

    @Test
    @DisplayName("Bus vide (0 sièges) → prix inchangé")
    void smartPricing_BusVide_PrixInchange() {
        double prix = tarificationService.calculerPrixAvecRemplissage(
                100.0, 0, 0
        );
        assertThat(prix).isEqualTo(100.0);
    }

    // ===== Tests Catégories Tarifaires =====

    @Test
    @DisplayName("Étudiant → -25%")
    void categorie_Etudiant_Reduction25() {
        double prix = tarificationService.appliquerCategorie(
                100.0, CategorieTarifaire.ETUDIANT
        );
        assertThat(prix).isEqualTo(75.0);
    }

    @Test
    @DisplayName("Enfant → -50%")
    void categorie_Enfant_Reduction50() {
        double prix = tarificationService.appliquerCategorie(
                100.0, CategorieTarifaire.ENFANT
        );
        assertThat(prix).isEqualTo(50.0);
    }

    @Test
    @DisplayName("Militaire → -30%")
    void categorie_Militaire_Reduction30() {
        double prix = tarificationService.appliquerCategorie(
                100.0, CategorieTarifaire.MILITAIRE
        );
        assertThat(prix).isEqualTo(70.0);
    }

    @Test
    @DisplayName("Senior → -20%")
    void categorie_Senior_Reduction20() {
        double prix = tarificationService.appliquerCategorie(
                100.0, CategorieTarifaire.SENIOR
        );
        assertThat(prix).isEqualTo(80.0);
    }

    @Test
    @DisplayName("Normal → 0%")
    void categorie_Normal_PrixInchange() {
        double prix = tarificationService.appliquerCategorie(
                100.0, CategorieTarifaire.NORMAL
        );
        assertThat(prix).isEqualTo(100.0);
    }

    // ===== Tests Prix Final Complet =====

    @Test
    @DisplayName("Prix final : 30j + remplissage normal + étudiant + promo 10%")
    void calculerPrixFinal_Complet() {
        // Base: 100
        // 30j avant: -20% → 80
        // Remplissage normal (50%): 80
        // Étudiant -25%: 60
        // Promo 10%: 54
        double prix = tarificationService.calculerPrixFinal(
                100.0,
                LocalDateTime.now().plusDays(31),
                45, 22,
                CategorieTarifaire.ETUDIANT,
                10.0
        );
        assertThat(prix).isEqualTo(54.0);
    }

    @Test
    @DisplayName("Prix final sans promo → null géré")
    void calculerPrixFinal_SansPromo() {
        double prix = tarificationService.calculerPrixFinal(
                100.0,
                LocalDateTime.now().plusDays(7),
                45, 22,
                CategorieTarifaire.NORMAL,
                null
        );
        assertThat(prix).isEqualTo(100.0);
    }

    // ===== Tests Configuration =====

    @Test
    @DisplayName("Configurer règles → nouvelles règles appliquées")
    void configurerRegles_NouvellesRegles() {
        // Reconfigurer avec de nouvelles valeurs
        tarificationService.configurerRegles(
                30.0,  // réduction 30j = 30%
                15.0,  // réduction 15j = 15%
                20.0,  // supplément J0 = 20%
                90.0, 25.0,  // seuil haut
                20.0, 15.0   // seuil bas
        );

        // 30j avant → maintenant -30% au lieu de -20%
        double prix = tarificationService.calculerPrixAvecDelai(
                100.0,
                LocalDateTime.now().plusDays(31)
        );
        assertThat(prix).isEqualTo(70.0);
    }
}