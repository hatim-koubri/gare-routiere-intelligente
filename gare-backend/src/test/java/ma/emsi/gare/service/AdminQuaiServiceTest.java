package ma.emsi.gare.service;

import ma.emsi.gare.dto.request.QuaiRequest;
import ma.emsi.gare.entity.Compagnie;
import ma.emsi.gare.entity.Quai;
import ma.emsi.gare.repository.CompagnieRepository;
import ma.emsi.gare.repository.QuaiRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminQuaiService — Tests unitaires")
class AdminQuaiServiceTest {

    @Mock private QuaiRepository quaiRepository;
    @Mock private CompagnieRepository compagnieRepository;
    @InjectMocks private AdminQuaiService adminQuaiService;

    private Quai quai;
    private Compagnie ctm;

    @BeforeEach
    void setUp() {
        ctm = new Compagnie();
        ctm.setId(1L);
        ctm.setNom("CTM");

        quai = new Quai();
        quai.setId(1L);
        quai.setNumero(1);
        quai.setTarifHoraire(50.0);
        quai.setDisponible(true);
    }

    @Test
    @DisplayName("Créer quai — succès")
    void creerQuai_Success() {
        QuaiRequest request = new QuaiRequest();
        request.setNumero(1);
        request.setTarifHoraire(50.0);

        when(quaiRepository.existsByNumero(1)).thenReturn(false);
        when(quaiRepository.save(any())).thenReturn(quai);

        Quai result = adminQuaiService.creerQuai(request);

        assertThat(result.getNumero()).isEqualTo(1);
        assertThat(result.isDisponible()).isTrue();
    }

    @Test
    @DisplayName("Créer quai — numéro déjà existant → exception")
    void creerQuai_NumeroExistant_ThrowsException() {
        QuaiRequest request = new QuaiRequest();
        request.setNumero(1);
        request.setTarifHoraire(50.0);

        when(quaiRepository.existsByNumero(1)).thenReturn(true);

        assertThatThrownBy(() -> adminQuaiService.creerQuai(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Numéro de quai déjà existant");
    }

    @Test
    @DisplayName("Attribuer quai — max 5 quais respecté")
    void attribuerQuai_Max5Respecte_Success() {
        when(quaiRepository.findById(1L)).thenReturn(Optional.of(quai));
        when(compagnieRepository.findById(1L)).thenReturn(Optional.of(ctm));
        when(quaiRepository.countByCompagnieId(1L)).thenReturn(4L); // 4 < 5
        when(quaiRepository.save(any())).thenReturn(quai);

        Quai result = adminQuaiService.attribuerQuaiACompagnie(1L, 1L);

        assertThat(result).isNotNull();
        verify(quaiRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Attribuer quai — limite 5 dépassée → exception")
    void attribuerQuai_LimiteDepasse_ThrowsException() {
        when(quaiRepository.findById(1L)).thenReturn(Optional.of(quai));
        when(quaiRepository.countByCompagnieId(1L)).thenReturn(5L); // déjà 5

        assertThatThrownBy(() -> adminQuaiService.attribuerQuaiACompagnie(1L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Limite atteinte");
    }

    @Test
    @DisplayName("Libérer quai — compagnie devient null")
    void libererQuai_Success() {
        quai.setCompagnie(ctm);
        when(quaiRepository.findById(1L)).thenReturn(Optional.of(quai));
        when(quaiRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Quai result = adminQuaiService.libererQuai(1L);

        assertThat(result.getCompagnie()).isNull();
        assertThat(result.isDisponible()).isTrue();
    }
}