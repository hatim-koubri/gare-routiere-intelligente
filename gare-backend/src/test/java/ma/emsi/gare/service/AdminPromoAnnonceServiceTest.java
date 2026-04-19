package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.CodePromoRequest;
import ma.emsi.gare.entity.CodePromo;
import ma.emsi.gare.repository.AnnonceRepository;
import ma.emsi.gare.repository.CodePromoRepository;
import ma.emsi.gare.repository.CompagnieRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminPromoAnnonceService — Tests unitaires")
class AdminPromoAnnonceServiceTest {

    @Mock private CodePromoRepository codePromoRepository;
    @Mock private AnnonceRepository annonceRepository;
    @Mock private CompagnieRepository compagnieRepository;
    @InjectMocks private AdminPromoAnnonceService promoService;

    private CodePromo promo;
    private CodePromoRequest promoRequest;

    @BeforeEach
    void setUp() {
        promo = new CodePromo();
        promo.setId(1L);
        promo.setCode("EMSI2026");
        promo.setPourcentageReduction(15.0);
        promo.setDateExpiration(LocalDateTime.now().plusDays(30));
        promo.setNbUtilisationsMax(100);
        promo.setNbUtilisationsActuel(0);
        promo.setActif(true);

        promoRequest = new CodePromoRequest();
        promoRequest.setCode("EMSI2026");
        promoRequest.setPourcentageReduction(15.0);
        promoRequest.setDateExpiration(LocalDateTime.now().plusDays(30));
        promoRequest.setNbUtilisationsMax(100);
    }

    @Test
    @DisplayName("Créer code promo — succès")
    void creerCodePromo_Success() {
        when(codePromoRepository.existsByCode("EMSI2026")).thenReturn(false);
        when(codePromoRepository.save(any())).thenReturn(promo);

        CodePromo result = promoService.creerCodePromo(promoRequest);

        assertThat(result.getCode()).isEqualTo("EMSI2026");
        assertThat(result.isActif()).isTrue();
        assertThat(result.getNbUtilisationsActuel()).isEqualTo(0);
    }

    @Test
    @DisplayName("Créer code promo — code déjà existant → exception")
    void creerCodePromo_CodeExistant_ThrowsException() {
        when(codePromoRepository.existsByCode("EMSI2026")).thenReturn(true);

        assertThatThrownBy(() -> promoService.creerCodePromo(promoRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Code promo déjà existant");
    }

    @Test
    @DisplayName("Valider code promo — valide → retourne promo")
    void validerCodePromo_Valide_Success() {
        when(codePromoRepository.findByCode("EMSI2026"))
                .thenReturn(Optional.of(promo));

        CodePromo result = promoService.validerCodePromo("EMSI2026");

        assertThat(result).isNotNull();
        assertThat(result.getPourcentageReduction()).isEqualTo(15.0);
    }

    @Test
    @DisplayName("Valider code promo — expiré → exception")
    void validerCodePromo_Expire_ThrowsException() {
        promo.setDateExpiration(LocalDateTime.now().minusDays(1)); // expiré
        when(codePromoRepository.findByCode("EMSI2026"))
                .thenReturn(Optional.of(promo));

        assertThatThrownBy(() -> promoService.validerCodePromo("EMSI2026"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Code promo expiré");
    }

    @Test
    @DisplayName("Valider code promo — désactivé → exception")
    void validerCodePromo_Desactive_ThrowsException() {
        promo.setActif(false);
        when(codePromoRepository.findByCode("EMSI2026"))
                .thenReturn(Optional.of(promo));

        assertThatThrownBy(() -> promoService.validerCodePromo("EMSI2026"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Code promo désactivé");
    }

    @Test
    @DisplayName("Valider code promo — épuisé → exception")
    void validerCodePromo_Epuise_ThrowsException() {
        promo.setNbUtilisationsActuel(100); // max atteint
        when(codePromoRepository.findByCode("EMSI2026"))
                .thenReturn(Optional.of(promo));

        assertThatThrownBy(() -> promoService.validerCodePromo("EMSI2026"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Code promo épuisé");
    }

    @Test
    @DisplayName("Désactiver promo — actif devient false")
    void desactiverCodePromo_Success() {
        when(codePromoRepository.findById(1L)).thenReturn(Optional.of(promo));
        when(codePromoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CodePromo result = promoService.desactiverCodePromo(1L);

        assertThat(result.isActif()).isFalse();
    }
}